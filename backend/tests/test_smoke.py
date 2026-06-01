"""Smoke tests that don't call the Anthropic API."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from agenticqa.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_health(client: TestClient) -> None:
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_list_jira_tickets(client: TestClient) -> None:
    r = client.get("/api/jira/tickets")
    assert r.status_code == 200
    keys = [t["key"] for t in r.json()]
    assert "PROJ-123" in keys


def test_get_unknown_ticket_404(client: TestClient) -> None:
    r = client.post("/api/runs", json={"jira_ticket": "DOES-NOT-EXIST"})
    assert r.status_code == 404


def test_create_run_lands_in_requirements_awaiting_approval(client: TestClient) -> None:
    r = client.post("/api/runs", json={"jira_ticket": "PROJ-123"})
    assert r.status_code == 201
    run = r.json()
    assert run["jira_ticket"] == "PROJ-123"
    assert run["current_stage"] == "requirements"
    req_stage = next(s for s in run["stages"] if s["name"] == "requirements")
    assert req_stage["status"] == "awaiting_approval"
    assert req_stage["artifact"]["key"] == "PROJ-123"
