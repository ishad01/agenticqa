from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="AGENTICQA_", extra="ignore")

    anthropic_api_key: str = ""
    runs_dir: Path = Path(".runs")
    model: str = "claude-opus-4-7"
    triage_model: str = "claude-sonnet-4-6"
    # When true, agent stages return canned fixture artifacts instead of calling
    # the Anthropic API. Lets the full pipeline complete without a real API key —
    # useful for demos, end-to-end UI testing, and CI.
    mock_mode: bool = False


def get_settings() -> Settings:
    settings = Settings()
    if not settings.anthropic_api_key:
        import os
        settings.anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    settings.runs_dir.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
