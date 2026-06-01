"""Build-readiness trigger for the QE workflow.

A ticket sits in one of these states:
  idle          → no merge detected yet (initial)
  checking      → polling the git repo
  build_ready   → a mergeable commit was detected; the QE workflow is about to start
  in_progress   → the QE workflow has been auto-triggered; run_id is set
  done          → the auto-triggered run reached its terminal stage
  failed        → the check or auto-run failed

The flow `idle → checking → build_ready → in_progress` is simulated server-side
in mock mode so the UI can show a believable end-to-end trigger.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime
from enum import Enum
from threading import RLock

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..adapters import jira_adapter
from ..store import new_run

router = APIRouter()


class BuildState(str, Enum):
    IDLE = "idle"
    CHECKING = "checking"
    BUILD_READY = "build_ready"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    FAILED = "failed"


class BuildStatus(BaseModel):
    ticket_key: str
    state: BuildState = BuildState.IDLE
    commit: str | None = None
    branch: str | None = None
    detected_at: datetime | None = None
    run_id: str | None = None
    message: str | None = None
    updated_at: datetime = datetime.now(UTC)


_lock = RLock()
_state: dict[str, BuildStatus] = {}


def _get_or_init(key: str) -> BuildStatus:
    with _lock:
        s = _state.get(key)
        if s is None:
            s = BuildStatus(ticket_key=key)
            _state[key] = s
        return s


def _set(key: str, **kwargs) -> BuildStatus:
    with _lock:
        s = _get_or_init(key)
        for k, v in kwargs.items():
            setattr(s, k, v)
        s.updated_at = datetime.now(UTC)
        return s


@router.get("/jira/tickets/builds", response_model=list[BuildStatus])
async def list_builds() -> list[BuildStatus]:
    """Status map for every ticket known to the build watcher."""
    # Make sure every fixture ticket has a row, even if no one has triggered it yet.
    tickets = await jira_adapter.list_tickets()
    for t in tickets:
        _get_or_init(t.key)
    with _lock:
        return list(_state.values())


@router.post("/jira/tickets/{key}/check", response_model=BuildStatus)
async def check_build(key: str) -> BuildStatus:
    """Simulate checking the git repository for a mergeable commit.
    Returns immediately with state=CHECKING; the background task flips through
    build_ready → in_progress as the run is auto-created."""
    tickets = {t.key for t in await jira_adapter.list_tickets()}
    if key not in tickets:
        raise HTTPException(404, f"Ticket {key} not found")

    current = _get_or_init(key)
    if current.state in (BuildState.CHECKING, BuildState.IN_PROGRESS):
        # already in flight — return existing state instead of double-triggering
        return current

    _set(
        key,
        state=BuildState.CHECKING,
        commit=None,
        branch=None,
        run_id=None,
        message="Polling main branch for a mergeable commit…",
    )
    asyncio.create_task(_simulate_build_flow(key))
    return _get_or_init(key)


async def _simulate_build_flow(key: str) -> None:
    """Mock: pretend to poll git, find a merge, then kick off a real QE run."""
    # 2-3s of "checking" so the UI can show progress.
    await asyncio.sleep(2.5)

    sha = uuid.uuid4().hex[:7]
    branch = f"feat/{key.lower()}-merge"
    _set(
        key,
        state=BuildState.BUILD_READY,
        commit=sha,
        branch=branch,
        detected_at=datetime.now(UTC),
        message=f"Mergeable commit {sha} found on {branch}. Auto-starting QE workflow…",
    )

    # Brief pause so the "Build ready" state is visible.
    await asyncio.sleep(1.5)

    # Auto-create the run.
    try:
        tickets = await jira_adapter.list_tickets()
        ticket = next((t for t in tickets if t.key == key), None)
        if ticket is None:
            raise RuntimeError(f"Ticket {key} disappeared during auto-run.")
        run = new_run(str(uuid.uuid4()), key, ticket.title)
        _set(
            key,
            state=BuildState.IN_PROGRESS,
            run_id=run.id,
            message=f"QE workflow in progress · run {run.id[:8]}.",
        )
    except Exception as e:
        _set(
            key,
            state=BuildState.FAILED,
            message=f"Auto-run failed to start: {type(e).__name__}: {e}",
        )
