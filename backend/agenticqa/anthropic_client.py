from __future__ import annotations

from functools import lru_cache

from anthropic import AsyncAnthropic

from .config import settings


@lru_cache(maxsize=1)
def get_client() -> AsyncAnthropic:
    if not settings.anthropic_api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to backend/.env or export it."
        )
    return AsyncAnthropic(api_key=settings.anthropic_api_key)
