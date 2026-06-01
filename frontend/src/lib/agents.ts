import {
  Bot,
  Bug,
  Database,
  FileCode2,
  FileSearch,
  FlaskConical,
  GitBranch,
  GitPullRequest,
  GitMerge,
  Hammer,
  Network,
  PlayCircle,
  Radar,
  RotateCw,
  Search,
  Tag,
  TestTube,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { StageName } from "@/lib/types";

export interface AgentTool {
  name: string;
  icon: LucideIcon;
  description: string;
}

export interface AgentDefinition {
  stage: StageName;
  name: string;
  short: string;
  role: string;
  glyph: LucideIcon;
  accent: "primary" | "info" | "success" | "warning" | "danger";
  model: string;
  temperature: number;
  maxTokens: number;
  tools: AgentTool[];
  ragIndexes: string[];
  capabilities: string[];
  systemPrompt: string;
}

/** Stages that run without a human review gate. Matches backend
 *  AUTO_APPROVE_STAGES in api/runs.py. HITL remains on: requirements,
 *  bdd (test case creation), and triage (failure analysis). */
export const AUTO_STAGES: ReadonlySet<StageName> = new Set<StageName>([
  "synthesis",
  "playwright",
  "regression",
  "execution",
  "bug_filed",
  "re_run",
]);

export function isAutoStage(name: StageName): boolean {
  return AUTO_STAGES.has(name);
}

const TOOLS = {
  jira: {
    name: "jira_api",
    icon: Tag,
    description: "Fetch tickets, ACs, labels; create defect issues with full markdown body.",
  },
  vector: {
    name: "vector_search",
    icon: Database,
    description: "Semantic search across embedded repo + design docs (cosine, top-k).",
  },
  grep: {
    name: "repo_grep",
    icon: Search,
    description: "Ripgrep over the source tree for exact matches.",
  },
  docs: {
    name: "docs_fetch",
    icon: FileSearch,
    description: "Pull HLD / LLD pages from Confluence-backed index.",
  },
  bdd_write: {
    name: "bdd_writer",
    icon: GitBranch,
    description: "Render Gherkin scenarios from acceptance criteria with tag policy.",
  },
  pw_codegen: {
    name: "playwright_codegen",
    icon: FileCode2,
    description: "Translate BDD scenarios into Playwright .spec.ts test files.",
  },
  pw_runner: {
    name: "playwright_runner",
    icon: TestTube,
    description: "Execute a Playwright test suite against a target environment.",
  },
  repo_pr: {
    name: "repo_pr",
    icon: GitPullRequest,
    description: "Open a branch + PR with generated tests, link the run.",
  },
  pipeline: {
    name: "gitlab_pipeline",
    icon: PlayCircle,
    description: "Trigger GitLab CI on the test branch; tail status.",
  },
  triage: {
    name: "failure_triage",
    icon: Hammer,
    description: "Cluster failures, deduplicate stacks, propose severity.",
  },
  bug_writer: {
    name: "bug_writer",
    icon: Bug,
    description: "Compose reproduction-grade bug body + attach trace + screenshots.",
  },
  embed: {
    name: "embedder",
    icon: Network,
    description: "Embed text with text-embedding-3-large for indexing or query.",
  },
  impact_graph: {
    name: "impact_graph",
    icon: GitMerge,
    description: "Builds a test→source dependency graph; given a diff, returns impacted test ids.",
  },
  diff_analyzer: {
    name: "diff_analyzer",
    icon: Radar,
    description: "Parses the PR diff to enumerate touched files, symbols, and routes.",
  },
} satisfies Record<string, AgentTool>;

export const AGENTS: AgentDefinition[] = [
  {
    stage: "requirements",
    name: "Requirements Analysis Agent",
    short: "REQ",
    role: "Pulls the Jira story and structures acceptance criteria into testable requirements.",
    glyph: Tag,
    accent: "info",
    model: "claude-haiku-4-5",
    temperature: 0.1,
    maxTokens: 2048,
    tools: [TOOLS.jira],
    ragIndexes: [],
    capabilities: ["parse", "normalize", "ac-extraction"],
    systemPrompt:
      "You are the Requirements Analysis Agent. Pull a Jira ticket, normalize its acceptance criteria into testable Given/When/Then candidates, and emit a structured ticket artifact.",
  },
  {
    stage: "synthesis",
    name: "Context Synthesis Agent",
    short: "CTX",
    role: "Builds a consolidated context doc from the repo, HLD/LLD, and prior tickets via RAG.",
    glyph: FileSearch,
    accent: "primary",
    model: "claude-sonnet-4-6",
    temperature: 0.2,
    maxTokens: 8192,
    tools: [TOOLS.vector, TOOLS.grep, TOOLS.docs, TOOLS.embed],
    ragIndexes: ["repo_docs", "lld_corpus", "jira_history"],
    capabilities: ["retrieval", "summarization", "code-aware"],
    systemPrompt:
      "You are the Context Synthesis Agent. Given a ticket, retrieve relevant repo files, design docs, and prior similar tickets; produce a consolidated markdown context with sources.",
  },
  {
    stage: "bdd",
    name: "Generate Test Cases Agent",
    short: "GTC",
    role: "Authors BDD / Gherkin test cases covering happy paths, edge cases, and error states.",
    glyph: GitBranch,
    accent: "info",
    model: "claude-sonnet-4-6",
    temperature: 0.3,
    maxTokens: 6144,
    tools: [TOOLS.bdd_write, TOOLS.vector],
    ragIndexes: ["bdd_corpus", "tag_policy"],
    capabilities: ["scenario-design", "tagging", "edge-case-mining"],
    systemPrompt:
      "You are the Generate Test Cases Agent. From the context doc, produce Gherkin feature/scenarios covering happy paths, edge cases, and error states. Tag scenarios per the team tag policy.",
  },
  {
    stage: "playwright",
    name: "Test Automation Agent",
    short: "AUT",
    role: "Generates Playwright TypeScript automation from test cases and opens a PR on the repo.",
    glyph: FlaskConical,
    accent: "primary",
    model: "claude-opus-4-7",
    temperature: 0.2,
    maxTokens: 16384,
    tools: [TOOLS.pw_codegen, TOOLS.vector, TOOLS.repo_pr],
    ragIndexes: ["repo_docs", "test_corpus"],
    capabilities: ["typescript", "selectors", "fixtures", "page-objects"],
    systemPrompt:
      "You are the Test Automation Agent. Translate BDD test cases into idiomatic Playwright TypeScript using existing page objects and fixtures. Open a PR with the new tests, link to the run.",
  },
  {
    stage: "regression",
    name: "Dynamic Test Selection Agent",
    short: "DTS",
    role: "Selects only the test cases impacted by this change and runs the focused suite.",
    glyph: Radar,
    accent: "info",
    model: "claude-sonnet-4-6",
    temperature: 0.1,
    maxTokens: 3072,
    tools: [TOOLS.diff_analyzer, TOOLS.impact_graph, TOOLS.vector, TOOLS.pw_runner],
    ragIndexes: ["test_corpus", "repo_docs"],
    capabilities: ["impact-analysis", "test-selection", "flake-aware", "fast-feedback"],
    systemPrompt:
      "You are the Dynamic Test Selection Agent. Given the PR diff, compute the set of impacted test cases using the test→source impact graph, then run only that focused subset. Skip irrelevant tests to keep feedback fast; escalate to full suite if impact is unbounded.",
  },
  {
    stage: "execution",
    name: "Pipeline Execution Agent",
    short: "EXE",
    role: "Triggers and monitors the CI pipeline on the target env; collects pass/fail with stacks.",
    glyph: PlayCircle,
    accent: "success",
    model: "claude-haiku-4-5",
    temperature: 0,
    maxTokens: 1024,
    tools: [TOOLS.pipeline, TOOLS.pw_runner],
    ragIndexes: ["pipeline_history"],
    capabilities: ["multi-env", "flake-detection", "artifact-collection"],
    systemPrompt:
      "You are the Pipeline Execution Agent. Trigger the test suite on the requested environment, collect pass/fail with stacks, screenshots, and timings.",
  },
  {
    stage: "triage",
    name: "Failure Analysis QA Agent",
    short: "QFA",
    role: "Diagnoses failures, clusters incidents, and proposes severity + priority.",
    glyph: Wrench,
    accent: "warning",
    model: "claude-opus-4-7",
    temperature: 0.2,
    maxTokens: 6144,
    tools: [TOOLS.triage, TOOLS.vector, TOOLS.grep],
    ragIndexes: ["incident_history", "runbooks"],
    capabilities: ["root-cause", "clustering", "severity-scoring"],
    systemPrompt:
      "You are the Failure Analysis QA Agent. Cluster the failures, dedupe by stack, look up similar past incidents, and propose severity + reproduction steps.",
  },
  {
    stage: "bug_filed",
    name: "Defect Management Agent",
    short: "DEF",
    role: "Files a reproduction-grade defect in Jira and links it back to the originating story.",
    glyph: Bug,
    accent: "danger",
    model: "claude-sonnet-4-6",
    temperature: 0.1,
    maxTokens: 4096,
    tools: [TOOLS.bug_writer, TOOLS.jira],
    ragIndexes: ["jira_history"],
    capabilities: ["repro-steps", "expected-vs-actual", "attachments"],
    systemPrompt:
      "You are the Defect Management Agent. Compose a clean Jira defect with summary, repro steps, expected vs actual, severity, and link the originating story.",
  },
  {
    stage: "re_run",
    name: "Re-run Agent",
    short: "RRN",
    role: "Watches for the fix commit, then re-triggers DTS + Pipeline Execution to close the loop.",
    glyph: RotateCw,
    accent: "success",
    model: "claude-haiku-4-5",
    temperature: 0,
    maxTokens: 1024,
    tools: [TOOLS.diff_analyzer, TOOLS.impact_graph, TOOLS.pipeline, TOOLS.pw_runner],
    ragIndexes: ["pipeline_history"],
    capabilities: ["fix-detection", "auto-retrigger", "loop-closure"],
    systemPrompt:
      "You are the Re-run Agent. After a defect is filed, watch the repo for a fix commit referencing the bug. When found, ask Dynamic Test Selection to recompute the impacted subset and re-trigger Pipeline Execution. Report the outcome to close the loop.",
  },
];

export const AGENT_BY_STAGE: Record<StageName, AgentDefinition> = AGENTS.reduce(
  (m, a) => {
    m[a.stage] = a;
    return m;
  },
  {} as Record<StageName, AgentDefinition>,
);

export interface RagHit {
  doc: string;
  index: string;
  score: number;
  snippet: string;
}

export interface TraceEvent {
  ts: number; // ms offset from run start
  agent: StageName;
  op:
    | "thinking"
    | "tool_call"
    | "retrieve"
    | "embed"
    | "generate"
    | "approved"
    | "rejected"
    | "error";
  tool?: string;
  label: string;
  detail?: string;
  durationMs?: number;
}

export interface VectorIndex {
  name: string;
  vectors: number;
  dimensions: number;
  lastRefresh: string;
  model: string;
  size: string;
}

export const VECTOR_INDEXES: VectorIndex[] = [
  {
    name: "repo_docs",
    vectors: 12_847,
    dimensions: 3072,
    lastRefresh: "2026-05-29T08:14:00Z",
    model: "text-embedding-3-large",
    size: "182 MB",
  },
  {
    name: "lld_corpus",
    vectors: 3_402,
    dimensions: 3072,
    lastRefresh: "2026-05-28T22:01:00Z",
    model: "text-embedding-3-large",
    size: "48 MB",
  },
  {
    name: "jira_history",
    vectors: 5_613,
    dimensions: 1536,
    lastRefresh: "2026-05-29T11:00:00Z",
    model: "text-embedding-3-small",
    size: "41 MB",
  },
  {
    name: "test_corpus",
    vectors: 8_902,
    dimensions: 3072,
    lastRefresh: "2026-05-28T18:30:00Z",
    model: "text-embedding-3-large",
    size: "126 MB",
  },
  {
    name: "bdd_corpus",
    vectors: 2_104,
    dimensions: 1536,
    lastRefresh: "2026-05-27T14:22:00Z",
    model: "text-embedding-3-small",
    size: "15 MB",
  },
  {
    name: "incident_history",
    vectors: 1_887,
    dimensions: 1536,
    lastRefresh: "2026-05-29T03:00:00Z",
    model: "text-embedding-3-small",
    size: "14 MB",
  },
  {
    name: "runbooks",
    vectors: 642,
    dimensions: 1536,
    lastRefresh: "2026-05-26T12:00:00Z",
    model: "text-embedding-3-small",
    size: "5 MB",
  },
];

export const AGENT_AVATAR: LucideIcon = Bot;
