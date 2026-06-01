import {
  Bug,
  ClipboardList,
  FileSearch,
  FlaskConical,
  PlayCircle,
  Radar,
  RotateCw,
  ScrollText,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { Stage, StageName, StageStatus } from "@/lib/types";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/types";

/**
 * Return the matching stage from the run, or a synthetic "pending" placeholder when
 * the backend hasn't yet emitted that stage (e.g. the new regression stage).
 */
export function synthStage(name: StageName): Stage {
  return {
    name,
    status: "pending",
    artifact: null,
    error: null,
    started_at: null,
    completed_at: null,
    reviewer_note: null,
  };
}

export function getStage(stages: Stage[], name: StageName): Stage {
  return stages.find((s) => s.name === name) ?? synthStage(name);
}

export const STAGE_ICONS: Record<StageName, LucideIcon> = {
  requirements: ClipboardList,
  synthesis: FileSearch,
  bdd: ScrollText,
  playwright: FlaskConical,
  regression: Radar,
  execution: PlayCircle,
  triage: Wrench,
  bug_filed: Bug,
  re_run: RotateCw,
};

export const STAGE_BLURB: Record<StageName, string> = {
  requirements: "Jira ticket pulled and acceptance criteria parsed.",
  synthesis: "Repo summary, HLD/LLD, and ticket merged into one context doc.",
  bdd: "Gherkin test cases generated from acceptance criteria.",
  playwright: "Playwright .spec.ts tests derived from BDD test cases.",
  regression: "Impact graph + diff to select & run only impacted tests.",
  execution: "GitLab pipeline run; results gathered.",
  triage: "Failure root-cause analysis & bug report drafted.",
  bug_filed: "Defect created in Jira and linked back to the story.",
  re_run: "Watches for the fix commit, then re-runs DTS + execution to close the loop.",
};

export const STATUS_LABELS: Record<StageStatus, string> = {
  pending: "Pending",
  running: "Running",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
  skipped: "Skipped",
  error: "Error",
};

export interface StatusStyle {
  dot: string;
  text: string;
  bg: string;
  border: string;
  ring: string;
}

export const STATUS_STYLES: Record<StageStatus, StatusStyle> = {
  pending: {
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
    bg: "bg-muted/40",
    border: "border-border",
    ring: "ring-border",
  },
  running: {
    dot: "bg-info",
    text: "text-info",
    bg: "bg-info/10",
    border: "border-info/40",
    ring: "ring-info/40",
  },
  awaiting_approval: {
    dot: "bg-warning",
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/40",
    ring: "ring-warning/40",
  },
  approved: {
    dot: "bg-success",
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    ring: "ring-success/40",
  },
  rejected: {
    dot: "bg-destructive",
    text: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/40",
    ring: "ring-destructive/40",
  },
  skipped: {
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
    bg: "bg-muted/40",
    border: "border-border",
    ring: "ring-border",
  },
  error: {
    dot: "bg-destructive",
    text: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/40",
    ring: "ring-destructive/40",
  },
};

export function isInFlight(status: StageStatus): boolean {
  return status === "running" || status === "awaiting_approval";
}

export function isRunActive(stages: Stage[]): boolean {
  return stages.some((s) => isInFlight(s.status));
}

export function progress(stages: Stage[]): { done: number; total: number; pct: number } {
  const total = STAGE_ORDER.length;
  const done = stages.filter(
    (s) => s.status === "approved" || s.status === "skipped",
  ).length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export { STAGE_LABELS, STAGE_ORDER };
