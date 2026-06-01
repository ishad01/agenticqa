from __future__ import annotations

import random
from typing import Protocol

from ..models import ExecutionArtifact, FailedTest, PlaywrightArtifact


class GitLabAdapter(Protocol):
    async def trigger(
        self, ref: str, variables: dict[str, str], playwright: PlaywrightArtifact
    ) -> ExecutionArtifact: ...
    async def status(self, pipeline_id: str) -> ExecutionArtifact: ...


class MockGitLabAdapter:
    """Returns a deterministic-but-realistic-feeling result.

    Tickets ending in an odd number (e.g. PROJ-123) produce a failing suite so
    the Failure-Analysis path / Defect filing demo path can be exercised. Tickets
    ending in an even number (e.g. PROJ-124) produce a clean green suite so the
    promotion-lanes / shipped path can be demoed. The actual Playwright artifact
    isn't executed; failure scenarios are sampled from its `test_files` content."""

    async def trigger(
        self, ref: str, variables: dict[str, str], playwright: PlaywrightArtifact
    ) -> ExecutionArtifact:
        pid = f"mock-{random.randint(10_000, 99_999)}"
        ticket = variables.get("JIRA_TICKET", "")
        # Even-numbered tickets are the happy path. (Falls back to failed if no
        # ticket info is supplied, preserving prior behavior.)
        is_happy_path = _trailing_int(ticket) % 2 == 0 if ticket else False

        if is_happy_path:
            total = sum(_test_count_in(f.content) for f in playwright.test_files) or 7
            return ExecutionArtifact(
                pipeline_id=pid,
                status="success",
                url=f"https://gitlab.example.com/mock/-/pipelines/{pid}",
                summary=(
                    f"All {total} test(s) passed across "
                    f"{len(playwright.test_files)} spec file(s). Ready to promote."
                ),
                failed_tests=[],
            )

        failures = self._sample_failures(playwright)
        return ExecutionArtifact(
            pipeline_id=pid,
            status="failed" if failures else "success",
            url=f"https://gitlab.example.com/mock/-/pipelines/{pid}",
            summary=(
                f"{len(failures)} test(s) failed across 1 spec file."
                if failures
                else "All tests passed."
            ),
            failed_tests=failures,
        )

    async def status(self, pipeline_id: str) -> ExecutionArtifact:
        return ExecutionArtifact(
            pipeline_id=pipeline_id,
            status="failed",
            url=f"https://gitlab.example.com/mock/-/pipelines/{pipeline_id}",
            summary="1 test failed.",
            failed_tests=[
                FailedTest(
                    scenario_name="Invalid credentials show inline error",
                    error_message=(
                        "expect(locator).toHaveValue('') failed.\n"
                        "Expected: ''\nReceived: 'hunter2'\n"
                        "Locator: [data-testid=\"login-password\"]"
                    ),
                    stack="at login.spec.ts:42:36",
                )
            ],
        )

    def _sample_failures(self, playwright: PlaywrightArtifact) -> list[FailedTest]:
        # Find a scenario-like test name to make the mock failure look grounded.
        scenario_name = "Invalid credentials show inline error"
        for f in playwright.test_files:
            for line in f.content.splitlines():
                stripped = line.strip()
                if stripped.startswith("test(") or stripped.startswith("test.skip("):
                    quoted = _extract_quoted(stripped)
                    if quoted and ("invalid" in quoted.lower() or "error" in quoted.lower()):
                        scenario_name = quoted
                        break
        return [
            FailedTest(
                scenario_name=scenario_name,
                error_message=(
                    "expect(locator).toHaveValue('') failed.\n"
                    "Expected: ''\n"
                    "Received: 'hunter2'\n"
                    "Locator: [data-testid=\"login-password\"]"
                ),
                stack="at login.spec.ts:42:36",
            )
        ]


def _extract_quoted(s: str) -> str | None:
    for q in ('"', "'", "`"):
        if q in s:
            try:
                return s.split(q, 2)[1]
            except IndexError:
                continue
    return None


def _trailing_int(s: str) -> int:
    digits: list[str] = []
    for ch in reversed(s):
        if ch.isdigit():
            digits.append(ch)
        else:
            break
    if not digits:
        return 0
    return int("".join(reversed(digits)))


def _test_count_in(source: str) -> int:
    return sum(
        1
        for line in source.splitlines()
        if line.strip().startswith(("test(", "test.skip(", "test.only("))
    )


gitlab_adapter: GitLabAdapter = MockGitLabAdapter()
