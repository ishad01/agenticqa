"""Dynamic Test Selection agent — given the PR diff and the generated Playwright
suite, returns the focused subset of tests to run.

In mock mode this loads a canned RegressionArtifact from
fixtures/artifacts/regression.json. With a real LLM key, it would call Claude with
the diff + impact graph to pick the impacted tests."""
from __future__ import annotations

from ..config import settings
from ..models import PlaywrightArtifact, RegressionArtifact


async def select_tests(playwright: PlaywrightArtifact) -> RegressionArtifact:
    if settings.mock_mode:
        from .mocks import load_artifact
        return load_artifact("regression", RegressionArtifact)

    # Real path would call the LLM with the diff + impact graph here.
    # For now, fall back to "run everything" when no fixture is wired.
    all_cases = [
        {"spec": f.path, "case": "*", "reason": "no impact graph configured — full suite"}
        for f in playwright.test_files
    ]
    return RegressionArtifact(
        strategy="full",
        diff_summary="No diff analyzer wired; selecting the full suite.",
        touched_files=[],
        selected=all_cases,  # type: ignore[arg-type]
        skipped_count=0,
        total_count=len(all_cases),
        estimated_seconds=60 * len(all_cases),
        notes="Wire a real diff analyzer + impact graph to enable focused selection.",
    )
