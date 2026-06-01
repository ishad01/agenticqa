from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from threading import RLock

from .config import settings
from .models import Run, RunSummary, STAGE_ORDER, Stage, StageName

_lock = RLock()


def _path(run_id: str) -> Path:
    return settings.runs_dir / f"{run_id}.json"


def list_runs() -> list[RunSummary]:
    with _lock:
        summaries: list[RunSummary] = []
        for p in sorted(settings.runs_dir.glob("*.json")):
            try:
                run = Run.model_validate_json(p.read_text())
            except Exception:
                continue
            current = run.get_stage(run.current_stage)
            summaries.append(
                RunSummary(
                    id=run.id,
                    jira_ticket=run.jira_ticket,
                    title=run.title,
                    current_stage=run.current_stage,
                    current_status=current.status,
                    updated_at=run.updated_at,
                )
            )
        summaries.sort(
            key=lambda s: s.updated_at if s.updated_at.tzinfo else s.updated_at.replace(tzinfo=UTC),
            reverse=True,
        )
        return summaries


def get_run(run_id: str) -> Run | None:
    with _lock:
        p = _path(run_id)
        if not p.exists():
            return None
        run = Run.model_validate_json(p.read_text())
        _backfill_missing_stages(run)
        return run


def _backfill_missing_stages(run: Run) -> None:
    """When STAGE_ORDER grows (e.g. adding REGRESSION), older run JSON files
    on disk won't have entries for the new stages. Insert PENDING placeholders
    in the correct positions so the rest of the pipeline keeps working."""
    have = {s.name for s in run.stages}
    if all(name in have for name in STAGE_ORDER):
        return
    by_name = {s.name: s for s in run.stages}
    run.stages = [
        by_name.get(name) or Stage(name=name) for name in STAGE_ORDER
    ]


def save_run(run: Run) -> Run:
    with _lock:
        run.updated_at = datetime.now(UTC)
        _path(run.id).write_text(run.model_dump_json(indent=2))
        return run


def new_run(run_id: str, jira_ticket: str, title: str) -> Run:
    now = datetime.now(UTC)
    run = Run(
        id=run_id,
        jira_ticket=jira_ticket,
        title=title,
        created_at=now,
        updated_at=now,
        current_stage=StageName.REQUIREMENTS,
        stages=[Stage(name=name) for name in STAGE_ORDER],
    )
    return save_run(run)


def advance_stage(run: Run) -> StageName | None:
    """Return the next pending stage after the current one, or None if at the end."""
    try:
        idx = STAGE_ORDER.index(run.current_stage)
    except ValueError:
        return None
    if idx + 1 >= len(STAGE_ORDER):
        return None
    next_stage = STAGE_ORDER[idx + 1]
    run.current_stage = next_stage
    return next_stage
