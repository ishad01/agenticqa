# agenticqa

Enterprise-grade Quality Engineering agentic AI. Reads requirements from Jira,
codebase, and design docs; generates BDD test cases and Playwright scripts;
selects the impacted regression subset, triggers a CI pipeline, files defects
on failure, and re-runs after the fix — with a human-in-the-loop checkpoint
only where it matters.

## Demo

📖 **[Full walkthrough → DEMO.md](./DEMO.md)** — every page, every flow, with
screenshots from a live run.

![Run detail · Agent IDE](docs/demo/demo-run-detail.png)

<!-- VIDEO

Paste a GitHub-hosted asset URL between the angle brackets to embed it:

https://github.com/ishad01/agenticqa/assets/<id>.mp4

Drag a .mp4 / .mov into a new GitHub issue to get the URL.

-->

## Stack

- **Backend** — FastAPI + Anthropic Python SDK (Claude Opus 4.7 / Sonnet 4.6 /
  Haiku 4.5, adaptive thinking, prompt caching)
- **Frontend** — Vite + React + TypeScript + Tailwind + shadcn/ui, with a
  LangGraph-Studio-style Agent IDE (palette / flow canvas / inspector)
- **Storage** — file-backed run store under `.runs/` (Postgres later)
- **Integrations** — Jira / GitLab / repo / docs via a pluggable adapter
  pattern; mocks today

## Agent fleet (9 specialists)

```
Requirements Analysis → Context Synthesis → Generate Test Cases → Test Automation
   → Dynamic Test Selection → Pipeline Execution → Failure Analysis QA
   → Defect Management → Re-run
```

Human-in-the-loop gates on **Requirements Analysis**, **Generate Test Cases**,
and **Failure Analysis QA** only. Everything else auto-advances with a 3-second
visible "running" window so the UI reflects progress.

The Re-run agent closes the loop: after a defect is filed and the developer
pushes a fix, Dynamic Test Selection recomputes the impacted subset and
Pipeline Execution replays — if green, the promotion lanes light up just like
a clean first run.

## Promotion lanes

`dev` and `staging` auto-promote on a green suite (from either the original
execution or the Re-run loop). `production` is the only HITL gate beyond the
agent pipeline — an explicit `Approve → Production` button.

## Build-ready trigger

A repo-watcher polls each Jira ticket for a mergeable commit. When found, the
QE workflow auto-starts and the ticket flips to `in_progress` with a link to
the new run. See [DEMO.md §3](./DEMO.md#3--ready-for-qe-workflow--build-ready-trigger).

## Quick start

### 1 · Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
# For an end-to-end demo with no LLM cost, leave AGENTICQA_MOCK_MODE=true in .env.
# To call the real Anthropic API, add ANTHROPIC_API_KEY and unset/false the mock flag.
uvicorn agenticqa.main:app --reload --port 8000
```

### 2 · Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

### 3 · Walk the slice

1. Open `http://localhost:5173` → **How it works** page for the architecture
   tour.
2. Go to **Ready for QE Workflow** → click `Check repo for build · PROJ-124`
   on the row → watch the build-watcher pick up a "merge" → a new run
   auto-starts → `Open run →`.
3. The Agent IDE walks you through requirements → BDD → playwright → DTS →
   pipeline execution. Approve / reject artifacts via the `Review artifact &
   decide` modal at each HITL gate.
4. On PROJ-124 the pipeline passes and the promotion lanes activate. Click
   `Approve → Production` to ship.
5. Try PROJ-123 to see the failure path → Failure Analysis review → defect
   filed → Re-run closes the loop.

See [DEMO.md](./DEMO.md) for the full visual walkthrough.
