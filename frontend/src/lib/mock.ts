import { AGENT_BY_STAGE, type RagHit, type TraceEvent } from "@/lib/agents";
import { STAGE_ORDER } from "@/lib/stage";
import type { Run, Stage, StageName } from "@/lib/types";

/** Deterministic xorshift RNG seeded from a string. */
function seedFrom(s: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return h / 0xffffffff;
  };
}

const REPO_DOCS = [
  "src/auth/login.ts",
  "src/auth/session.ts",
  "src/components/LoginForm.tsx",
  "src/api/auth.ts",
  "docs/HLD-auth.md",
  "docs/LLD-session-cookie.md",
  "PROJ-122 · password reset",
  "PROJ-117 · session refresh",
  "PROJ-098 · OAuth Google",
  "README.md",
  "tests/e2e/login.spec.ts",
  "tests/e2e/session.spec.ts",
  "playwright.config.ts",
  "fixtures/users.json",
  "src/middleware/rate-limit.ts",
  "incident-2025-11-14-lockout",
  "runbooks/auth-rotate.md",
];

const SNIPPETS = [
  "// Cookie set with HttpOnly; Secure; SameSite=Lax",
  "Given a registered user with valid credentials",
  "expect(page).toHaveURL(/\\/dashboard/);",
  "## Session lifetime — 24h sliding, rotated on each request",
  "Status: closed · resolution: cookie name collision",
  "await loginPage.submit({ email, password });",
  "describe('login flow', () => {",
  "if (attempts >= 5) lockAccount(user)",
];

export function ragHits(seed: string, indexes: string[], top = 7): RagHit[] {
  const rng = seedFrom(seed);
  const out: RagHit[] = [];
  for (let i = 0; i < top; i++) {
    const idx = indexes[Math.floor(rng() * indexes.length)] ?? "repo_docs";
    const doc = REPO_DOCS[Math.floor(rng() * REPO_DOCS.length)];
    const snippet = SNIPPETS[Math.floor(rng() * SNIPPETS.length)];
    const score = 0.98 - i * 0.07 - rng() * 0.03;
    out.push({ index: idx, doc, snippet, score: Number(score.toFixed(2)) });
  }
  return out.sort((a, b) => b.score - a.score);
}

const OP_LABELS: Record<string, string> = {
  thinking: "thinking",
  tool_call: "tool",
  retrieve: "retrieve",
  embed: "embed",
  generate: "generate",
  approved: "approved",
  rejected: "rejected",
  error: "error",
};

export function getOpLabel(op: TraceEvent["op"]): string {
  return OP_LABELS[op] ?? op;
}

/** Build a believable per-run agent trace based on stage statuses. */
export function buildTrace(run: Run): TraceEvent[] {
  const rng = seedFrom(run.id);
  const events: TraceEvent[] = [];
  let t = 0;

  for (const stage of run.stages) {
    const agent = AGENT_BY_STAGE[stage.name];
    if (!agent) continue;

    // Stages that haven't started won't have events yet
    const reached =
      stage.status !== "pending" && stage.status !== "skipped";
    if (!reached) continue;

    // Thinking
    const thinkMs = 200 + Math.floor(rng() * 800);
    events.push({
      ts: t,
      agent: stage.name,
      op: "thinking",
      label: `${agent.short.toLowerCase()} · plan`,
      detail: agent.role,
      durationMs: thinkMs,
    });
    t += thinkMs;

    // Tool calls — one per tool (capped)
    for (const tool of agent.tools.slice(0, 3)) {
      const ms = 120 + Math.floor(rng() * 900);
      events.push({
        ts: t,
        agent: stage.name,
        op: tool.name === "vector_search" ? "retrieve" : tool.name === "embedder" ? "embed" : "tool_call",
        tool: tool.name,
        label:
          tool.name === "vector_search"
            ? `vector_search(top=7, idx=${agent.ragIndexes[0] ?? "repo_docs"})`
            : tool.name === "embedder"
              ? `embed("…")  · 3072d`
              : `${tool.name}()`,
        detail: tool.description,
        durationMs: ms,
      });
      t += ms;
    }

    if (stage.status === "running") {
      events.push({
        ts: t,
        agent: stage.name,
        op: "thinking",
        label: `${agent.short.toLowerCase()} · drafting artifact`,
      });
      return events;
    }

    if (stage.status === "error") {
      events.push({
        ts: t,
        agent: stage.name,
        op: "error",
        label: `${agent.short.toLowerCase()} · failed`,
        detail: stage.error ?? "unknown error",
        durationMs: 0,
      });
      t += 50;
      continue;
    }

    // Generate
    const genMs = 1200 + Math.floor(rng() * 4800);
    events.push({
      ts: t,
      agent: stage.name,
      op: "generate",
      label: `${agent.short.toLowerCase()} · artifact generated`,
      detail: stage.artifact ? `${Object.keys(stage.artifact).length} fields` : undefined,
      durationMs: genMs,
    });
    t += genMs;

    if (stage.status === "approved") {
      events.push({
        ts: t,
        agent: stage.name,
        op: "approved",
        label: `${agent.short.toLowerCase()} · approved by reviewer`,
      });
      t += 200;
    } else if (stage.status === "rejected") {
      events.push({
        ts: t,
        agent: stage.name,
        op: "rejected",
        label: `${agent.short.toLowerCase()} · rejected`,
        detail: stage.reviewer_note ?? undefined,
      });
      t += 200;
    }
  }

  return events;
}

/* ---- envs ---- */

export type EnvName = "dev" | "staging" | "prod";

export interface EnvLane {
  env: EnvName;
  status: "idle" | "running" | "passed" | "failed";
  passed: number;
  failed: number;
  lastRun: string | null;
  durationMs?: number;
  promotable: boolean;
  /** What signal flipped this lane green — "execution" on first pass,
   *  "re_run" when the loop re-closed after a defect was filed and fixed. */
  via?: "execution" | "re_run";
}

export function envLanesFor(run: Run): EnvLane[] {
  const exec = run.stages.find((s) => s.name === "execution")!;
  const rerun = run.stages.find((s) => s.name === "re_run");
  const rng = seedFrom(run.id + "envs");

  const execPassed =
    exec.status === "approved" &&
    (exec.artifact as { status?: string } | null)?.status === "success";

  const rerunPassed =
    rerun?.status === "approved" &&
    (rerun.artifact as { status?: string } | null)?.status === "success";

  // The pipeline is "green" if either the initial execution passed OR the
  // post-fix re-run closed the loop successfully. Promotion proceeds the same
  // way in both cases.
  const greenLight = execPassed || rerunPassed;
  const ranOnDev = greenLight || exec.status === "approved" || exec.status === "running";
  const via: "execution" | "re_run" | undefined = execPassed
    ? "execution"
    : rerunPassed
      ? "re_run"
      : undefined;

  const baseDuration = 60_000 + Math.floor(rng() * 240_000);
  const stagingDuration = 80_000 + Math.floor(rng() * 180_000);
  const passedTotal = 12 + Math.floor(rng() * 6);

  return [
    {
      env: "dev",
      status: ranOnDev
        ? greenLight
          ? "passed"
          : exec.status === "running"
            ? "running"
            : "failed"
        : "idle",
      passed: greenLight ? passedTotal : 0,
      failed: greenLight ? 0 : 1 + Math.floor(rng() * 2),
      lastRun: ranOnDev ? new Date(Date.now() - 6 * 60_000).toISOString() : null,
      durationMs: ranOnDev ? baseDuration : undefined,
      promotable: greenLight,
      via,
    },
    {
      // Staging is auto-promoted on dev pass — no HITL gate.
      env: "staging",
      status: greenLight ? "passed" : "idle",
      passed: greenLight ? passedTotal : 0,
      failed: 0,
      lastRun: greenLight ? new Date(Date.now() - 2 * 60_000).toISOString() : null,
      durationMs: greenLight ? stagingDuration : undefined,
      promotable: greenLight,
      via,
    },
    {
      // Production requires a human HITL approval (handled in EnvLanes UI).
      env: "prod",
      status: "idle",
      passed: 0,
      failed: 0,
      lastRun: null,
      promotable: false,
      via,
    },
  ];
}

/* ---- canvas layout ---- */

export interface NodePos {
  stage: StageName;
  x: number;
  y: number;
}

/** Two rows of 4 nodes plus a re-run loop node — snaking through the canvas. */
export function defaultLayout(): NodePos[] {
  const positions: Array<[number, number]> = [
    [0.08, 0.28], // requirements
    [0.27, 0.28], // synthesis
    [0.46, 0.28], // bdd (Generate Test Cases)
    [0.65, 0.28], // playwright (Test Automation)
    [0.84, 0.28], // regression (Dynamic Test Selection)
    [0.84, 0.72], // execution (Pipeline Execution)
    [0.62, 0.72], // triage (Failure Analysis)
    [0.40, 0.72], // bug_filed (Defect)
    [0.18, 0.72], // re_run (Re-run Agent)
  ];
  return STAGE_ORDER.map((stage, i) => ({
    stage,
    x: positions[i][0],
    y: positions[i][1],
  }));
}

/** Quick helper: find the most "interesting" stage to default-select. */
export function defaultSelectedStage(run: Run): StageName {
  // prefer awaiting_approval > error > running > current
  const order: Stage["status"][] = ["awaiting_approval", "error", "running"];
  for (const s of order) {
    const match = run.stages.find((x) => x.status === s);
    if (match) return match.name;
  }
  return run.current_stage;
}
