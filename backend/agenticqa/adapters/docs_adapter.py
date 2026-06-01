from __future__ import annotations

from pathlib import Path
from typing import Protocol

_DOCS = Path(__file__).parent.parent / "fixtures" / "docs"


class DocsAdapter(Protocol):
    async def hld(self, ticket_key: str) -> str: ...
    async def lld(self, ticket_key: str) -> str: ...


class MockDocsAdapter:
    async def hld(self, ticket_key: str) -> str:
        return (_DOCS / "hld.md").read_text()

    async def lld(self, ticket_key: str) -> str:
        return (_DOCS / "lld.md").read_text()


docs_adapter: DocsAdapter = MockDocsAdapter()
