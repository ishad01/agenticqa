from __future__ import annotations

import json

from ..anthropic_client import get_client
from ..config import settings
from ..models import (
    BddArtifact,
    ExecutionArtifact,
    JiraTicket,
    TriageArtifact,
)
from .prompts import TRIAGE_SCHEMA, TRIAGE_SYSTEM


async def triage_failures(
    ticket: JiraTicket,
    context_markdown: str,
    bdd: BddArtifact,
    execution: ExecutionArtifact,
) -> TriageArtifact:
    if settings.mock_mode:
        from .mocks import load_artifact
        return load_artifact("triage", TriageArtifact, ticket.key)

    client = get_client()
    response = await client.messages.create(
        model=settings.triage_model,
        max_tokens=8000,
        thinking={"type": "adaptive"},
        output_config={
            "effort": "medium",
            "format": {"type": "json_schema", "schema": TRIAGE_SCHEMA},
        },
        system=[
            {
                "type": "text",
                "text": TRIAGE_SYSTEM,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": (
                    "<story>\n"
                    f"{ticket.model_dump_json(indent=2)}\n"
                    "</story>\n\n"
                    "<context>\n"
                    f"{context_markdown}\n"
                    "</context>\n\n"
                    "<bdd_feature>\n"
                    f"{bdd.model_dump_json(indent=2)}\n"
                    "</bdd_feature>\n\n"
                    "<pipeline_result>\n"
                    f"{execution.model_dump_json(indent=2)}\n"
                    "</pipeline_result>\n\n"
                    "Triage the failure(s) and return the structured bug draft. "
                    "If multiple tests failed, focus on the most user-impactful one; "
                    "summarize the rest in `summary_markdown`. Use the story key for "
                    "`related_jira`. No prose outside JSON."
                ),
            }
        ],
    )

    text = "".join(b.text for b in response.content if b.type == "text").strip()
    payload = json.loads(text)
    return TriageArtifact.model_validate(payload)
