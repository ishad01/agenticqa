from __future__ import annotations

import json

from ..anthropic_client import get_client
from ..config import settings
from ..models import BddArtifact
from .prompts import BDD_SCHEMA, BDD_SYSTEM


async def generate_bdd(context_markdown: str) -> BddArtifact:
    if settings.mock_mode:
        from .mocks import load_artifact
        return load_artifact("bdd", BddArtifact)

    client = get_client()
    response = await client.messages.create(
        model=settings.model,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        output_config={
            "effort": "high",
            "format": {"type": "json_schema", "schema": BDD_SCHEMA},
        },
        system=[
            {
                "type": "text",
                "text": BDD_SYSTEM,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": (
                    "<context>\n"
                    f"{context_markdown}\n"
                    "</context>\n\n"
                    "Author the BDD feature and scenarios as a single JSON object that conforms "
                    "to the schema. No prose outside JSON."
                ),
            }
        ],
    )

    text = "".join(b.text for b in response.content if b.type == "text").strip()
    payload = json.loads(text)
    return BddArtifact.model_validate(payload)
