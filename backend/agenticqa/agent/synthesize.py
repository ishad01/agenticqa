from __future__ import annotations

from ..adapters import docs_adapter, jira_adapter, repo_adapter
from ..anthropic_client import get_client
from ..config import settings
from ..models import SynthesisArtifact
from .prompts import SYNTHESIZE_SYSTEM


def _user_message(ticket_json: str, repo: str, hld: str, lld: str) -> str:
    return f"""<jira_ticket>
{ticket_json}
</jira_ticket>

<repo_summary>
{repo}
</repo_summary>

<hld>
{hld}
</hld>

<lld>
{lld}
</lld>

Produce the consolidated context brief now."""


async def synthesize(ticket_key: str) -> SynthesisArtifact:
    ticket = await jira_adapter.get_ticket(ticket_key)
    repo = await repo_adapter.summary(ticket_key)
    hld = await docs_adapter.hld(ticket_key)
    lld = await docs_adapter.lld(ticket_key)

    if settings.mock_mode:
        from .mocks import load_artifact
        return load_artifact("synthesis", SynthesisArtifact, ticket_key)

    client = get_client()
    response = await client.messages.create(
        model=settings.model,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        output_config={"effort": "high"},
        system=[
            {
                "type": "text",
                "text": SYNTHESIZE_SYSTEM,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": _user_message(
                    ticket.model_dump_json(indent=2), repo, hld, lld
                ),
            }
        ],
    )

    text = "".join(b.text for b in response.content if b.type == "text").strip()
    return SynthesisArtifact(
        context_markdown=text,
        sources=[f"jira:{ticket_key}", "repo:summary", "docs:hld", "docs:lld"],
    )
