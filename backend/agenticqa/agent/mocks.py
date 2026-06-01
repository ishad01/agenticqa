"""Fixture-backed artifact loaders for AGENTICQA_MOCK_MODE.

When ``settings.mock_mode`` is true each agent module returns a canned artifact
parsed from ``backend/agenticqa/fixtures/artifacts/<name>.json`` instead of
calling the Anthropic API. Lets the full pipeline complete without a real key,
which is useful for demos, end-to-end UI testing, and CI.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import TypeVar

from pydantic import BaseModel

_FIXTURES = Path(__file__).parent.parent / "fixtures" / "artifacts"

T = TypeVar("T", bound=BaseModel)


def load_artifact(name: str, model: type[T], ticket_key: str = "") -> T:
    """Load `<name>.json` and substitute `{{TICKET_KEY}}` placeholders before parsing."""
    raw = (_FIXTURES / f"{name}.json").read_text()
    if ticket_key:
        raw = raw.replace("{{TICKET_KEY}}", ticket_key)
    payload = json.loads(raw)
    return model.model_validate(payload)
