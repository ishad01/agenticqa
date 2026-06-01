# agenticqa

Enterprise-grade Quality Engineering agentic AI. Reads requirements from Jira,
codebase, and design docs; produces BDD scenarios and Playwright scripts;
triggers GitLab pipelines and raises Jira bugs — with a human-in-the-loop
checkpoint after every stage.

## Stack

- **Backend** — FastAPI + Anthropic Python SDK (Claude Opus 4.7, adaptive thinking, prompt caching)
- **Frontend** — Vite + React + TypeScript + Tailwind + shadcn/ui
- **Storage** — file-backed run store under `.runs/` (Postgres later)
- **Integrations** — Jira / GitLab / repo / docs via a pluggable adapter pattern, with mocks today

## Pipeline (HITL between every stage)

```
Jira ticket
  → synthesize context (jira + repo + HLD + LLD)
  → BDD scenarios (Gherkin)
  → Playwright scripts
  → GitLab pipeline run
  → triage failures → Jira bug
```

## Quick start

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env          # add your ANTHROPIC_API_KEY
uvicorn agenticqa.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

### 3. Walk the slice

1. Open `http://localhost:5173`.
2. Start a new run from the seeded `PROJ-123` ticket.
3. Approve the synthesized context.
4. Approve / edit the generated BDD scenarios.
5. (Stages 3–5 in next iteration: Playwright generation, GitLab trigger, Jira bug raise.)
