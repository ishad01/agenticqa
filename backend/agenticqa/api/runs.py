from __future__ import annotations

import asyncio
import traceback
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from ..adapters import gitlab_adapter, jira_adapter
from ..agent.bdd import generate_bdd
from ..agent.playwright_gen import generate_playwright
from ..agent.re_run import rerun_after_fix
from ..agent.regression import select_tests
from ..agent.synthesize import synthesize
from ..agent.triage import triage_failures
from ..models import (
    ApproveRequest,
    BddArtifact,
    BugArtifact,
    CreateRunRequest,
    ExecutionArtifact,
    JiraTicket,
    PlaywrightArtifact,
    RegressionArtifact,
    RejectRequest,
    RerunArtifact,
    Run,
    RunSummary,
    StageName,
    StageStatus,
    SynthesisArtifact,
    TriageArtifact,
)
from ..store import advance_stage, get_run, list_runs, new_run, save_run

router = APIRouter()


# Stages the agent / adapter executes server-side. Other stages (REQUIREMENTS)
# are populated synchronously when a run is created.
AGENT_STAGES = {
    StageName.SYNTHESIS,
    StageName.BDD,
    StageName.PLAYWRIGHT,
    StageName.REGRESSION,
    StageName.EXECUTION,
    StageName.TRIAGE,
    StageName.BUG_FILED,
    StageName.RE_RUN,
}

# Stages that auto-approve and auto-advance after the agent completes — no human
# review needed. Triage stays human-in-the-loop because the reviewer signs off on
# the failure diagnosis; everything else in this set runs without a gate.
AUTO_APPROVE_STAGES = {
    StageName.SYNTHESIS,
    StageName.PLAYWRIGHT,
    StageName.REGRESSION,
    StageName.EXECUTION,
    StageName.BUG_FILED,
    StageName.RE_RUN,
}

# Visible "running" period inserted at the start of every agent stage so the
# polling frontend can render the RUNNING state instead of flashing past it.
RUNNING_DELAY_SEC = 3.0


@router.get("/jira/tickets", response_model=list[JiraTicket])
async def get_tickets() -> list[JiraTicket]:
    return await jira_adapter.list_tickets()


@router.get("/runs", response_model=list[RunSummary])
def get_runs() -> list[RunSummary]:
    return list_runs()


@router.get("/runs/{run_id}", response_model=Run)
def get_one_run(run_id: str) -> Run:
    run = get_run(run_id)
    if not run:
        raise HTTPException(404, f"Run {run_id} not found")
    return run


@router.post("/runs", response_model=Run, status_code=201)
async def create_run(req: CreateRunRequest) -> Run:
    try:
        ticket = await jira_adapter.get_ticket(req.jira_ticket)
    except KeyError as e:
        raise HTTPException(404, str(e)) from e

    run = new_run(
        run_id=str(uuid.uuid4()),
        jira_ticket=ticket.key,
        title=ticket.title,
    )
    req_stage = run.get_stage(StageName.REQUIREMENTS)
    req_stage.status = StageStatus.AWAITING_APPROVAL
    req_stage.artifact = ticket.model_dump()
    req_stage.started_at = datetime.now(UTC)
    req_stage.completed_at = datetime.now(UTC)
    return save_run(run)


def _build_bug_body(run: Run, triage: TriageArtifact, execution: ExecutionArtifact) -> str:
    repro = "\n".join(f"{i + 1}. {step}" for i, step in enumerate(triage.reproduction_steps))
    failures = "\n".join(
        f"- **{f.scenario_name}** — {f.error_message.splitlines()[0]}"
        for f in execution.failed_tests
    )
    return (
        f"## Summary\n\n{triage.summary_markdown}\n\n"
        f"## Steps to reproduce\n\n{repro}\n\n"
        f"## Expected\n\n{triage.expected}\n\n"
        f"## Actual\n\n{triage.actual}\n\n"
        f"## Failed tests\n\n{failures}\n\n"
        f"## Pipeline\n\n{execution.url}\n\n"
        f"## Related\n\n- Story: {run.jira_ticket}\n"
        f"- Severity: **{triage.severity}** (suggested priority {triage.suggested_priority})\n"
        f"- Agenticqa run: `{run.id}`\n"
    )


async def _execute_agent_stage(run: Run, stage_name: StageName):
    """Dispatch to the right agent/adapter for a given stage. Returns the artifact
    object (Pydantic model) or None if the stage should be marked SKIPPED."""
    if stage_name == StageName.SYNTHESIS:
        return await synthesize(run.jira_ticket)

    if stage_name == StageName.BDD:
        synth = run.get_stage(StageName.SYNTHESIS).artifact
        if not synth:
            raise RuntimeError("Synthesis artifact missing — cannot generate BDD.")
        return await generate_bdd(synth["context_markdown"])

    if stage_name == StageName.PLAYWRIGHT:
        synth = run.get_stage(StageName.SYNTHESIS).artifact
        bdd_raw = run.get_stage(StageName.BDD).artifact
        if not synth or not bdd_raw:
            raise RuntimeError("Synthesis or BDD artifact missing — cannot generate Playwright.")
        return await generate_playwright(
            synth["context_markdown"], BddArtifact.model_validate(bdd_raw)
        )

    if stage_name == StageName.REGRESSION:
        pw_raw = run.get_stage(StageName.PLAYWRIGHT).artifact
        if not pw_raw:
            raise RuntimeError("Playwright artifact missing — cannot select tests.")
        pw = PlaywrightArtifact.model_validate(pw_raw)
        return await select_tests(pw)

    if stage_name == StageName.EXECUTION:
        pw_raw = run.get_stage(StageName.PLAYWRIGHT).artifact
        if not pw_raw:
            raise RuntimeError("Playwright artifact missing — cannot run pipeline.")
        pw = PlaywrightArtifact.model_validate(pw_raw)
        return await gitlab_adapter.trigger(
            ref="main",
            variables={"JIRA_TICKET": run.jira_ticket},
            playwright=pw,
        )

    if stage_name == StageName.TRIAGE:
        exec_raw = run.get_stage(StageName.EXECUTION).artifact
        if not exec_raw:
            raise RuntimeError("Execution artifact missing — cannot triage.")
        execution = ExecutionArtifact.model_validate(exec_raw)
        if execution.status == "success":
            # No failures: nothing to triage. Caller will skip this and bug_filed.
            return None
        ticket = await jira_adapter.get_ticket(run.jira_ticket)
        synth = run.get_stage(StageName.SYNTHESIS).artifact
        bdd = BddArtifact.model_validate(run.get_stage(StageName.BDD).artifact)
        return await triage_failures(ticket, synth["context_markdown"], bdd, execution)

    if stage_name == StageName.BUG_FILED:
        triage_raw = run.get_stage(StageName.TRIAGE).artifact
        exec_raw = run.get_stage(StageName.EXECUTION).artifact
        if not triage_raw or not exec_raw:
            raise RuntimeError("Triage or execution artifact missing — cannot file bug.")
        triage = TriageArtifact.model_validate(triage_raw)
        execution = ExecutionArtifact.model_validate(exec_raw)
        body = _build_bug_body(run, triage, execution)
        jira_key = await jira_adapter.raise_bug(
            title=triage.title,
            description=body,
            links=[run.jira_ticket],
        )
        return BugArtifact(
            jira_key=jira_key,
            url=f"https://jira.example.com/browse/{jira_key}",
            title=triage.title,
            body_markdown=body,
        )

    if stage_name == StageName.RE_RUN:
        bug_raw = run.get_stage(StageName.BUG_FILED).artifact
        if not bug_raw:
            # Defect was never filed (e.g. happy path) — skip the re-run too.
            return None
        bug = BugArtifact.model_validate(bug_raw)
        return await rerun_after_fix(bug)

    return None


async def _run_stage(run: Run, stage_name: StageName) -> Run:
    # Re-fetch from disk so background invocations don't race with a recently
    # serialized HTTP response that holds the same Run object.
    fresh = get_run(run.id)
    if fresh is not None:
        run = fresh

    stage = run.get_stage(stage_name)
    stage.status = StageStatus.RUNNING
    stage.started_at = datetime.now(UTC)
    stage.error = None
    save_run(run)

    # Visible "running" period so the UI can show the stage in flight.
    await asyncio.sleep(RUNNING_DELAY_SEC)

    try:
        artifact = await _execute_agent_stage(run, stage_name)
        if artifact is None:
            stage.status = StageStatus.SKIPPED
        else:
            stage.artifact = artifact.model_dump()
            stage.status = (
                StageStatus.APPROVED
                if stage_name in AUTO_APPROVE_STAGES
                else StageStatus.AWAITING_APPROVAL
            )
    except Exception as e:
        stage.status = StageStatus.ERROR
        stage.error = f"{type(e).__name__}: {e}\n\n{traceback.format_exc()}"

    stage.completed_at = datetime.now(UTC)
    save_run(run)

    # Auto-advance for stages that don't need human review.
    if stage.status == StageStatus.APPROVED and stage_name in AUTO_APPROVE_STAGES:
        # EXECUTION special case: a green suite skips triage + bug_filed entirely.
        if stage_name == StageName.EXECUTION and stage.artifact:
            execution = ExecutionArtifact.model_validate(stage.artifact)
            if execution.status == "success":
                _mark_downstream_skipped(run, StageName.EXECUTION)
                return run
        next_stage = advance_stage(run)
        save_run(run)
        if next_stage in AGENT_STAGES:
            return await _run_stage(run, next_stage)

    return run


def _mark_downstream_skipped(run: Run, from_stage: StageName) -> None:
    """When the pipeline passed and there's nothing to triage, mark triage,
    bug_filed, and re_run as SKIPPED so the timeline reflects an actual end-state."""
    skip_set = {StageName.TRIAGE, StageName.BUG_FILED, StageName.RE_RUN}
    for s in run.stages:
        if s.name in skip_set and s.status == StageStatus.PENDING:
            s.status = StageStatus.SKIPPED
            s.started_at = datetime.now(UTC)
            s.completed_at = datetime.now(UTC)
    # Park the cursor at the final skipped stage so the UI shows completion.
    run.current_stage = from_stage
    save_run(run)


@router.post("/runs/{run_id}/stages/{stage}/approve", response_model=Run)
async def approve_stage(run_id: str, stage: StageName, req: ApproveRequest) -> Run:
    run = get_run(run_id)
    if not run:
        raise HTTPException(404, f"Run {run_id} not found")
    s = run.get_stage(stage)
    if s.status not in (StageStatus.AWAITING_APPROVAL, StageStatus.APPROVED):
        raise HTTPException(409, f"Stage {stage} is {s.status}; cannot approve.")

    if req.edited_artifact is not None:
        s.artifact = req.edited_artifact
    s.status = StageStatus.APPROVED
    s.reviewer_note = req.note
    save_run(run)

    # Special case: pipeline passed → skip triage + bug_filed.
    if stage == StageName.EXECUTION and s.artifact:
        execution = ExecutionArtifact.model_validate(s.artifact)
        if execution.status == "success":
            _mark_downstream_skipped(run, StageName.EXECUTION)
            return run

    next_stage = advance_stage(run)
    save_run(run)
    if next_stage in AGENT_STAGES:
        # Mark next stage RUNNING immediately so the HTTP response shows
        # activity and the frontend's "in-flight" poll kicks in.
        nx = run.get_stage(next_stage)
        nx.status = StageStatus.RUNNING
        nx.started_at = datetime.now(UTC)
        save_run(run)
        # Execute the chain in the background — return now so the user sees
        # the running state instead of waiting for the whole chain to finish.
        asyncio.create_task(_run_stage(run, next_stage))
    elif next_stage is not None:
        nx = run.get_stage(next_stage)
        nx.status = StageStatus.PENDING
        save_run(run)
    return run


@router.post("/runs/{run_id}/stages/{stage}/reject", response_model=Run)
def reject_stage(run_id: str, stage: StageName, req: RejectRequest) -> Run:
    run = get_run(run_id)
    if not run:
        raise HTTPException(404, f"Run {run_id} not found")
    s = run.get_stage(stage)
    s.status = StageStatus.REJECTED
    s.reviewer_note = req.note
    return save_run(run)


@router.post("/runs/{run_id}/stages/{stage}/retry", response_model=Run)
async def retry_stage(run_id: str, stage: StageName) -> Run:
    run = get_run(run_id)
    if not run:
        raise HTTPException(404, f"Run {run_id} not found")
    if stage in AGENT_STAGES:
        run.current_stage = stage
        s = run.get_stage(stage)
        s.status = StageStatus.RUNNING
        s.started_at = datetime.now(UTC)
        s.error = None
        save_run(run)
        # Fire-and-forget so the frontend can see the RUNNING state immediately.
        asyncio.create_task(_run_stage(run, stage))
    return run
