from __future__ import annotations

import json

from ..anthropic_client import get_client
from ..config import settings
from ..models import BddArtifact, PlaywrightArtifact
from .prompts import PLAYWRIGHT_SCHEMA, PLAYWRIGHT_SYSTEM


async def generate_playwright(
    context_markdown: str, bdd: BddArtifact
) -> PlaywrightArtifact:
    if settings.mock_mode:
        from .mocks import load_artifact
        return load_artifact("playwright", PlaywrightArtifact)

    client = get_client()
    response = await client.messages.create(
        model=settings.model,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        output_config={
            "effort": "high",
            "format": {"type": "json_schema", "schema": PLAYWRIGHT_SCHEMA},
        },
        system=[
            {
                "type": "text",
                "text": PLAYWRIGHT_SYSTEM,
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
                    "<bdd_feature>\n"
                    f"{bdd.model_dump_json(indent=2)}\n"
                    "</bdd_feature>\n\n"
                    "Author one or more Playwright TypeScript spec files that implement every "
                    "scenario above. Return the JSON object that conforms to the schema. "
                    "No prose outside JSON."
                ),
            }
        ],
    )

    text = "".join(b.text for b in response.content if b.type == "text").strip()
    payload = json.loads(text)
    return PlaywrightArtifact.model_validate(payload)
