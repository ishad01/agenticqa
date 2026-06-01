from __future__ import annotations

import json
from pathlib import Path
from typing import Protocol

from ..models import JiraTicket

_FIXTURES = Path(__file__).parent.parent / "fixtures" / "jira"


class JiraAdapter(Protocol):
    async def list_tickets(self) -> list[JiraTicket]: ...
    async def get_ticket(self, key: str) -> JiraTicket: ...
    async def raise_bug(self, title: str, description: str, links: list[str]) -> str: ...


class MockJiraAdapter:
    async def list_tickets(self) -> list[JiraTicket]:
        return [
            JiraTicket.model_validate_json(p.read_text())
            for p in sorted(_FIXTURES.glob("*.json"))
        ]

    async def get_ticket(self, key: str) -> JiraTicket:
        p = _FIXTURES / f"{key}.json"
        if not p.exists():
            raise KeyError(f"Jira ticket {key} not found")
        return JiraTicket.model_validate_json(p.read_text())

    async def raise_bug(self, title: str, description: str, links: list[str]) -> str:
        return f"PROJ-MOCK-{abs(hash(title)) % 10_000}"


jira_adapter: JiraAdapter = MockJiraAdapter()
