from __future__ import annotations

from pathlib import Path
from typing import Protocol

_FIXTURE = Path(__file__).parent.parent / "fixtures" / "repo_summary.md"


class RepoAdapter(Protocol):
    async def summary(self, ticket_key: str) -> str: ...


class MockRepoAdapter:
    async def summary(self, ticket_key: str) -> str:
        return _FIXTURE.read_text()


repo_adapter: RepoAdapter = MockRepoAdapter()
