export type StageName =
  | "requirements"
  | "synthesis"
  | "bdd"
  | "playwright"
  | "regression"
  | "execution"
  | "triage"
  | "bug_filed"
  | "re_run";

export type StageStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "skipped"
  | "error";

export interface Stage {
  name: StageName;
  status: StageStatus;
  artifact: Record<string, unknown> | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  reviewer_note: string | null;
}

export interface Run {
  id: string;
  jira_ticket: string;
  title: string;
  created_at: string;
  updated_at: string;
  stages: Stage[];
  current_stage: StageName;
}

export interface RunSummary {
  id: string;
  jira_ticket: string;
  title: string;
  current_stage: StageName;
  current_status: StageStatus;
  updated_at: string;
}

export interface JiraTicket {
  key: string;
  title: string;
  type: string;
  status: string;
  description: string;
  acceptance_criteria: string[];
  labels: string[];
}

export interface Step {
  keyword: "Given" | "When" | "Then" | "And" | "But";
  text: string;
}

export interface Scenario {
  name: string;
  tags: string[];
  steps: Step[];
  notes: string;
}

export interface BddArtifact {
  feature: string;
  description: string;
  background: Step[];
  scenarios: Scenario[];
}

export interface SynthesisArtifact {
  context_markdown: string;
  sources: string[];
}

export interface TestFile {
  path: string;
  language: "typescript" | "javascript";
  content: string;
}

export interface PlaywrightArtifact {
  test_files: TestFile[];
  notes: string;
}

export interface SelectedTest {
  spec: string;
  case: string;
  reason: string;
}

export interface RegressionArtifact {
  strategy: "impact-graph" | "tags" | "full";
  diff_summary: string;
  touched_files: string[];
  selected: SelectedTest[];
  skipped_count: number;
  total_count: number;
  estimated_seconds: number;
  notes: string;
}

export interface FailedTest {
  scenario_name: string;
  error_message: string;
  stack: string;
}

export interface ExecutionArtifact {
  pipeline_id: string;
  status: "success" | "failed" | "running";
  url: string;
  summary: string;
  failed_tests: FailedTest[];
}

export interface TriageArtifact {
  severity: "critical" | "high" | "medium" | "low";
  suggested_priority: "P0" | "P1" | "P2" | "P3";
  title: string;
  summary_markdown: string;
  reproduction_steps: string[];
  expected: string;
  actual: string;
  related_jira: string;
}

export interface BugArtifact {
  jira_key: string;
  url: string;
  title: string;
  body_markdown: string;
}

export const STAGE_ORDER: StageName[] = [
  "requirements",
  "synthesis",
  "bdd",
  "playwright",
  "regression",
  "execution",
  "triage",
  "bug_filed",
  "re_run",
];

export const STAGE_LABELS: Record<StageName, string> = {
  requirements: "Requirements analysis",
  synthesis: "Context synthesis",
  bdd: "Generate test cases",
  playwright: "Test automation",
  regression: "Dynamic test selection",
  execution: "Pipeline execution",
  triage: "Failure analysis",
  bug_filed: "Defect filed",
  re_run: "Re-run after fix",
};

export type BuildState =
  | "idle"
  | "checking"
  | "build_ready"
  | "in_progress"
  | "done"
  | "failed";

export interface BuildStatus {
  ticket_key: string;
  state: BuildState;
  commit: string | null;
  branch: string | null;
  detected_at: string | null;
  run_id: string | null;
  message: string | null;
  updated_at: string;
}

export interface RerunArtifact {
  fix_commit: string;
  fix_summary: string;
  rerun_pipeline_id: string;
  rerun_url: string;
  status: "success" | "failed" | "running";
  summary: string;
  selected_count: number;
  passed: number;
  failed: number;
  estimated_seconds: number;
}
