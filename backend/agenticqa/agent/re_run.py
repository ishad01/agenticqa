"""Re-run agent — after a defect has been filed and the developer pushes a fix,
this stage picks up the fix commit, asks Dynamic Test Selection to recompute the
impacted subset, and re-runs the suite. Reports the outcome.

In mock mode this loads a canned RerunArtifact from
fixtures/artifacts/re_run.json showing the loop closing successfully."""
from __future__ import annotations

from ..config import settings
from ..models import BugArtifact, RerunArtifact


async def rerun_after_fix(bug: BugArtifact) -> RerunArtifact:
    if settings.mock_mode:
        from .mocks import load_artifact
        return load_artifact("re_run", RerunArtifact)

    # Real implementation would: poll the source repo / Jira for the fix commit,
    # invoke the impact graph again on the new diff, re-trigger CI, and gather
    # results. For now, return a default "pending — waiting for fix" placeholder.
    return RerunArtifact(
        fix_commit="(pending)",
        fix_summary=f"Awaiting fix for {bug.jira_key}.",
        rerun_pipeline_id="pending",
        rerun_url="",
        status="running",
        summary="Watching the repository for a fix commit that references the filed defect.",
        selected_count=0,
        passed=0,
        failed=0,
        estimated_seconds=0,
    )
