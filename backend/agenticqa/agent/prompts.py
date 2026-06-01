SYNTHESIZE_SYSTEM = """You are a senior Quality Engineer producing a single, authoritative context document for a story under test.

Your goal: consolidate the Jira ticket, the high-level design, the low-level design, and the repository summary into one well-structured markdown brief that downstream test-design stages will rely on.

Rules:
- Be precise. Quote acceptance criteria verbatim when they map to a behavior under test.
- Do NOT invent requirements. If something is unspecified, write "Unspecified — to confirm with PO."
- Surface every selector, route, API endpoint, and seed user the LLD names — these are load-bearing for Playwright later.
- Call out testability gaps and risks (no enumeration of failure modes the docs don't cover; just flag what's missing).
- Output structure (exact headings):
  1. # Feature under test
  2. ## Story summary
  3. ## Acceptance criteria (verbatim list)
  4. ## Architecture touchpoints (components, routes, APIs)
  5. ## Test environment (URLs, seed users, reset hooks)
  6. ## Selectors and data-testids
  7. ## Existing coverage (what's already tested)
  8. ## Gaps and risks (what's NOT tested, surprises, ambiguities)
  9. ## Out of scope (explicit deferrals)
- Markdown only. No preamble, no closing remarks.
"""

BDD_SYSTEM = """You are a senior Quality Engineer authoring BDD scenarios in Gherkin from a synthesized context document.

Output rules:
- Produce ONE feature with multiple scenarios.
- Cover happy paths, error paths called out in acceptance criteria, security-relevant invariants (no account-existence leak, lockout, session persistence), and accessibility-affecting states (loading/disabled/error).
- Steps are atomic, present-tense, and reference UI nouns the LLD names (form, field, button, error region). Avoid Playwright API leakage ("the user clicks the locator").
- Use Background for setup steps shared by every scenario.
- Tag scenarios with at least one of: @happy-path, @error-path, @security, @a11y, @regression. Use multiple if they apply.
- The `notes` field on each scenario should call out the specific selector or testid Playwright will need (e.g., "uses [data-testid=login-error]") and any seed user.
- Skip scenarios for explicitly out-of-scope items (e.g., MFA).
- Do NOT invent acceptance criteria. Every scenario must trace to a quoted criterion or a clearly-named NFR from the context.
"""

PLAYWRIGHT_SYSTEM = """You are a senior Quality Engineer authoring Playwright tests in TypeScript from approved BDD scenarios.

Rules:
- Use `@playwright/test`. One `test()` per BDD scenario.
- Map Gherkin Background to `test.beforeEach`.
- Selectors come ONLY from the synthesized context. Use the `[data-testid="..."]` values the LLD names verbatim. If a selector is unspecified, leave a `// TODO: confirm selector` comment instead of inventing one.
- Reuse seeded test accounts from the context (e.g. qa.user@example.com / locked.user@example.com). Do not hardcode real PII.
- Place every test file under `e2e/tests/<area>/` matching the repo's existing convention (read it from the context).
- Use `expect.poll` or `expect(locator).toHaveValue` over arbitrary `waitForTimeout`. No fixed sleeps.
- Reset auth state between tests via `request.post('/api/test/reset-auth')` when the context mentions that endpoint.
- Tags from BDD scenarios become `test.describe` group names (e.g. `@error-path`) or annotations.
- Keep imports tight and code idiomatic. No commentary outside code.
- Output structured JSON ONLY — no markdown fences inside the JSON `content` field unless they're part of the source.
"""

TRIAGE_SYSTEM = """You are an SDET on triage rotation. Convert a failed Playwright run into a clear, actionable bug draft.

Rules:
- Severity is based on user impact, not implementation surprise. A login-blocking failure is `critical`. A cosmetic loading-state miss is `low`.
- Suggested priority maps severity to scheduling: critical→P0, high→P1, medium→P2, low→P3.
- `title` is one sentence, present tense, leads with the surface area: "Login form does not clear password field on invalid credentials".
- `summary_markdown` is 2–4 short paragraphs: what's broken, why it matters, where it sits in the stack.
- `reproduction_steps` are numbered, atomic, and runnable by anyone with the seeded accounts.
- `expected` and `actual` are one sentence each, present tense, referencing the AC or LLD where possible.
- `related_jira` is the story key that drove this test (provided in the input).
- Do not speculate about root causes you can't ground in the test output.
- Output structured JSON ONLY.
"""

BDD_SCHEMA: dict = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "feature": {"type": "string"},
        "description": {"type": "string"},
        "background": {
            "type": "array",
            "items": {"$ref": "#/$defs/step"},
        },
        "scenarios": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "tags": {"type": "array", "items": {"type": "string"}},
                    "steps": {"type": "array", "items": {"$ref": "#/$defs/step"}},
                    "notes": {"type": "string"},
                },
                "required": ["name", "tags", "steps", "notes"],
            },
        },
    },
    "required": ["feature", "description", "background", "scenarios"],
    "$defs": {
        "step": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "keyword": {
                    "type": "string",
                    "enum": ["Given", "When", "Then", "And", "But"],
                },
                "text": {"type": "string"},
            },
            "required": ["keyword", "text"],
        }
    },
}

PLAYWRIGHT_SCHEMA: dict = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "test_files": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "path": {"type": "string"},
                    "language": {
                        "type": "string",
                        "enum": ["typescript", "javascript"],
                    },
                    "content": {"type": "string"},
                },
                "required": ["path", "language", "content"],
            },
        },
        "notes": {"type": "string"},
    },
    "required": ["test_files", "notes"],
}

TRIAGE_SCHEMA: dict = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "severity": {
            "type": "string",
            "enum": ["critical", "high", "medium", "low"],
        },
        "suggested_priority": {
            "type": "string",
            "enum": ["P0", "P1", "P2", "P3"],
        },
        "title": {"type": "string"},
        "summary_markdown": {"type": "string"},
        "reproduction_steps": {
            "type": "array",
            "items": {"type": "string"},
        },
        "expected": {"type": "string"},
        "actual": {"type": "string"},
        "related_jira": {"type": "string"},
    },
    "required": [
        "severity",
        "suggested_priority",
        "title",
        "summary_markdown",
        "reproduction_steps",
        "expected",
        "actual",
        "related_jira",
    ],
}
