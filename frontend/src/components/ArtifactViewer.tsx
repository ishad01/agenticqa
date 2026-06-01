import {
  Bug,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  Files,
  GitBranch,
  GitCommit,
  Loader2,
  OctagonAlert,
  Radar,
  RotateCw,
  Tag,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { STAGE_BLURB, STAGE_LABELS } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type {
  BddArtifact,
  BugArtifact,
  ExecutionArtifact,
  JiraTicket,
  PlaywrightArtifact,
  RegressionArtifact,
  RerunArtifact,
  Scenario,
  Stage,
  SynthesisArtifact,
  TriageArtifact,
} from "@/lib/types";

interface Props {
  stage: Stage;
}

export function ArtifactViewer({ stage }: Props) {
  if (stage.status === "error") {
    return (
      <Surface className="border-destructive/40">
        <SurfaceHeader
          icon={<OctagonAlert className="h-4 w-4 text-destructive" />}
          title="Stage error"
          subtitle="The agent could not complete this stage."
        />
        <div className="border-t border-border bg-destructive/5 p-4">
          <pre className="whitespace-pre-wrap rounded bg-background/60 p-3 text-xs leading-relaxed font-mono">
            {stage.error}
          </pre>
        </div>
      </Surface>
    );
  }

  if (stage.status === "running") {
    return (
      <Surface>
        <div className="flex items-center gap-3 p-5">
          <Loader2 className="h-5 w-5 animate-spin text-info" />
          <div>
            <p className="text-sm font-medium">{STAGE_LABELS[stage.name]} is running…</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {STAGE_BLURB[stage.name]} Typically 20–60s.
            </p>
          </div>
        </div>
        <div className="border-t border-border bg-info/5 px-5 py-2 text-2xs text-info font-mono">
          Auto-refreshing every 2s
        </div>
      </Surface>
    );
  }

  if (!stage.artifact) {
    return (
      <Surface>
        <SurfaceHeader
          icon={<TriangleAlert className="h-4 w-4 text-muted-foreground" />}
          title="Pending"
          subtitle={`${STAGE_LABELS[stage.name]} runs after the prior stage is approved.`}
        />
      </Surface>
    );
  }

  switch (stage.name) {
    case "requirements":
      return <JiraView ticket={stage.artifact as unknown as JiraTicket} />;
    case "synthesis":
      return <SynthesisView synth={stage.artifact as unknown as SynthesisArtifact} />;
    case "bdd":
      return <BddView bdd={stage.artifact as unknown as BddArtifact} />;
    case "playwright":
      return <PlaywrightView pw={stage.artifact as unknown as PlaywrightArtifact} />;
    case "regression":
      return <RegressionView reg={stage.artifact as unknown as RegressionArtifact} />;
    case "execution":
      return <ExecutionView exec={stage.artifact as unknown as ExecutionArtifact} />;
    case "triage":
      return <TriageView triage={stage.artifact as unknown as TriageArtifact} />;
    case "bug_filed":
      return <BugView bug={stage.artifact as unknown as BugArtifact} />;
    case "re_run":
      return <RerunView rr={stage.artifact as unknown as RerunArtifact} />;
    default:
      return null;
  }
}

/* ---------- shared surface primitives ---------- */

function Surface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border bg-card overflow-hidden", className)}>
      {children}
    </section>
  );
}

function SurfaceHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-border bg-surface-1/40 px-4 py-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-md border border-border bg-muted/40">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}

/* ---------- per-stage views ---------- */

function JiraView({ ticket }: { ticket: JiraTicket }) {
  return (
    <Surface>
      <SurfaceHeader
        icon={<Tag className="h-4 w-4 text-info" />}
        title={
          <span className="flex items-center gap-2">
            <span className="font-mono text-2xs text-primary">{ticket.key}</span>
            <span>{ticket.title}</span>
          </span>
        }
        subtitle={
          <span className="flex items-center gap-1.5 mt-1">
            <Pill>{ticket.type}</Pill>
            <Pill tone="info">{ticket.status}</Pill>
            {ticket.labels.map((l) => (
              <Pill key={l}>{l}</Pill>
            ))}
          </span>
        }
      />
      <div className="p-4 space-y-4">
        <Section title="Description">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {ticket.description}
          </p>
        </Section>
        <Section title={`Acceptance criteria (${ticket.acceptance_criteria.length})`}>
          <ol className="space-y-1.5 text-sm">
            {ticket.acceptance_criteria.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-2xs text-muted-foreground">
                  AC{String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-foreground">{c}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </Surface>
  );
}

function SynthesisView({ synth }: { synth: SynthesisArtifact }) {
  return (
    <Surface>
      <SurfaceHeader
        icon={<Files className="h-4 w-4 text-info" />}
        title="Consolidated context"
        subtitle={`${synth.sources.length} source${synth.sources.length === 1 ? "" : "s"} merged.`}
        right={
          <div className="flex flex-wrap gap-1 max-w-[260px] justify-end">
            {synth.sources.map((s) => (
              <Pill key={s}>{s}</Pill>
            ))}
          </div>
        }
      />
      <div className="p-4">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground/90">
          {synth.context_markdown}
        </pre>
      </div>
    </Surface>
  );
}

function BddView({ bdd }: { bdd: BddArtifact }) {
  return (
    <Surface>
      <SurfaceHeader
        icon={<GitBranch className="h-4 w-4 text-info" />}
        title={`Feature: ${bdd.feature}`}
        subtitle={bdd.description}
      />
      <div className="p-4 space-y-4">
        {bdd.background.length > 0 && (
          <CodeBlock label="Background">
            <Steps steps={bdd.background} />
          </CodeBlock>
        )}
        {bdd.scenarios.map((s, i) => (
          <ScenarioCard key={i} scenario={s} index={i + 1} />
        ))}
      </div>
    </Surface>
  );
}

function ScenarioCard({ scenario, index }: { scenario: Scenario; index: number }) {
  return (
    <div className="rounded-md border border-border bg-surface-1/40 overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b border-border bg-surface-2/60 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-2xs text-primary">
            #{String(index).padStart(2, "0")}
          </span>
          <h4 className="text-sm font-medium truncate">{scenario.name}</h4>
        </div>
        {scenario.tags.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {scenario.tags.map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>
        )}
      </header>
      <div className="p-3">
        <Steps steps={scenario.steps} />
        {scenario.notes && (
          <p className="mt-2 border-t border-border pt-2 text-2xs text-muted-foreground">
            <span className="font-medium">Notes:</span> {scenario.notes}
          </p>
        )}
      </div>
    </div>
  );
}

const KEYWORD_COLOR: Record<string, string> = {
  Given: "text-info",
  When: "text-primary",
  Then: "text-success",
  And: "text-muted-foreground",
  But: "text-warning",
};

function Steps({ steps }: { steps: { keyword: string; text: string }[] }) {
  return (
    <ul className="font-mono text-xs leading-6 space-y-0.5">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-2">
          <span className={cn("font-semibold w-12 shrink-0", KEYWORD_COLOR[s.keyword] ?? "")}>
            {s.keyword}
          </span>
          <span className="text-foreground/90">{s.text}</span>
        </li>
      ))}
    </ul>
  );
}

function PlaywrightView({ pw }: { pw: PlaywrightArtifact }) {
  const [active, setActive] = useState(0);
  const file = pw.test_files[active];
  return (
    <Surface>
      <SurfaceHeader
        icon={<FileCode2 className="h-4 w-4 text-info" />}
        title={`Playwright (${pw.test_files.length} file${pw.test_files.length === 1 ? "" : "s"})`}
        subtitle={pw.notes || "Generated from BDD scenarios."}
      />
      {pw.test_files.length > 1 && (
        <nav className="flex items-center gap-0.5 overflow-x-auto border-b border-border bg-surface-1/40 px-2">
          {pw.test_files.map((f, i) => (
            <button
              key={f.path}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-mono transition-colors whitespace-nowrap",
                i === active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <FileCode2 className="h-3 w-3" />
              {f.path}
            </button>
          ))}
        </nav>
      )}
      {file && (
        <div className="bg-[hsl(240_14%_4%)]">
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-2xs text-muted-foreground">
            <span className="font-mono">{file.path}</span>
            <Pill>{file.language}</Pill>
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
            <code className="font-mono text-foreground/90">{file.content}</code>
          </pre>
        </div>
      )}
    </Surface>
  );
}

function RegressionView({ reg }: { reg: RegressionArtifact }) {
  const ran = reg.total_count - reg.skipped_count;
  return (
    <Surface className="border-info/40">
      <SurfaceHeader
        icon={<Radar className="h-4 w-4 text-info" />}
        title={
          <span className="flex items-center gap-2">
            Selected {reg.selected.length} of {reg.total_count} test cases
            <Pill tone="info">{reg.strategy}</Pill>
          </span>
        }
        subtitle={reg.diff_summary}
        right={
          <div className="text-right">
            <p className="font-mono text-2xs text-muted-foreground">est. runtime</p>
            <p className="font-mono text-sm text-info">
              ~{reg.estimated_seconds}s
            </p>
          </div>
        }
      />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Selected" value={ran} tone="info" />
          <Stat label="Skipped" value={reg.skipped_count} tone="muted" />
          <Stat label="Suite total" value={reg.total_count} tone="muted" />
        </div>

        {reg.touched_files.length > 0 && (
          <Section title={`Touched files (${reg.touched_files.length})`}>
            <ul className="flex flex-wrap gap-1.5">
              {reg.touched_files.map((f) => (
                <li
                  key={f}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs"
                >
                  <FileCode2 className="h-3 w-3 text-muted-foreground" />
                  {f}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title={`Selected test cases (${reg.selected.length})`}>
          <ul className="space-y-1.5">
            {reg.selected.map((s, i) => (
              <li
                key={i}
                className="rounded-md border border-border bg-surface-1/40 p-2.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{s.case}</p>
                  <span className="font-mono text-2xs text-info shrink-0">{s.spec}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
              </li>
            ))}
          </ul>
        </Section>

        {reg.notes && (
          <p className="text-2xs text-muted-foreground border-t border-border pt-2">
            {reg.notes}
          </p>
        )}
      </div>
    </Surface>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone: "info" | "muted";
}) {
  const text = tone === "info" ? "text-info" : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-surface-1/40 p-2.5">
      <p className="text-2xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-mono text-xl tabular-nums", text)}>{value}</p>
    </div>
  );
}

function ExecutionView({ exec }: { exec: ExecutionArtifact }) {
  const passed = exec.status === "success";
  return (
    <Surface className={passed ? "border-success/40" : "border-destructive/40"}>
      <SurfaceHeader
        icon={
          passed ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )
        }
        title={
          <span className="flex items-center gap-2">
            Pipeline {passed ? "passed" : "failed"}
            <span className="font-mono text-2xs text-muted-foreground">{exec.pipeline_id}</span>
          </span>
        }
        subtitle={exec.summary}
        right={
          <a
            href={exec.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-primary hover:bg-accent transition-colors"
          >
            GitLab <ExternalLink className="h-3 w-3" />
          </a>
        }
      />
      {exec.failed_tests.length > 0 && (
        <div className="border-t border-border p-4 space-y-2">
          <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Failed tests ({exec.failed_tests.length})
          </p>
          <ul className="space-y-2">
            {exec.failed_tests.map((t, i) => (
              <li
                key={i}
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1.5"
              >
                <p className="text-sm font-medium text-foreground">{t.scenario_name}</p>
                <pre className="text-xs whitespace-pre-wrap bg-background/60 rounded p-2 font-mono">
                  {t.error_message}
                </pre>
                {t.stack && (
                  <details className="text-2xs text-muted-foreground">
                    <summary className="cursor-pointer select-none">stack</summary>
                    <pre className="mt-1 whitespace-pre-wrap font-mono">{t.stack}</pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Surface>
  );
}

function severityTone(severity: TriageArtifact["severity"]): "danger" | "warning" | "default" {
  if (severity === "critical" || severity === "high") return "danger";
  if (severity === "medium") return "warning";
  return "default";
}

function TriageView({ triage }: { triage: TriageArtifact }) {
  const tone = severityTone(triage.severity);
  return (
    <Surface>
      <SurfaceHeader
        icon={<TriangleAlert className="h-4 w-4 text-warning" />}
        title={triage.title}
        subtitle={
          <span className="flex items-center gap-1.5">
            <Pill tone={tone === "danger" ? "danger" : tone === "warning" ? "warning" : "default"}>
              severity · {triage.severity}
            </Pill>
            <Pill tone="info">priority · {triage.suggested_priority}</Pill>
            {triage.related_jira && <Pill>↳ {triage.related_jira}</Pill>}
          </span>
        }
      />
      <div className="p-4 space-y-4">
        <Section title="Summary">
          <pre className="whitespace-pre-wrap text-sm font-sans text-foreground/90">
            {triage.summary_markdown}
          </pre>
        </Section>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-success/30 bg-success/5 p-3">
            <p className="text-2xs font-semibold uppercase tracking-wide text-success">Expected</p>
            <p className="mt-1.5 text-sm">{triage.expected}</p>
          </div>
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-2xs font-semibold uppercase tracking-wide text-destructive">Actual</p>
            <p className="mt-1.5 text-sm">{triage.actual}</p>
          </div>
        </div>
        <Section title="Reproduction">
          <ol className="space-y-1.5 text-sm">
            {triage.reproduction_steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-2xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </Surface>
  );
}

function RerunView({ rr }: { rr: RerunArtifact }) {
  const passed = rr.status === "success";
  return (
    <Surface className={passed ? "border-success/40" : "border-destructive/40"}>
      <SurfaceHeader
        icon={
          passed ? (
            <RotateCw className="h-4 w-4 text-success" />
          ) : (
            <RotateCw className="h-4 w-4 text-destructive" />
          )
        }
        title={
          <span className="flex items-center gap-2">
            Loop closed · re-run {passed ? "passed" : "failed"}
            <Pill tone={passed ? "success" : "danger"}>{rr.status}</Pill>
          </span>
        }
        subtitle={rr.summary}
        right={
          rr.rerun_url ? (
            <a
              href={rr.rerun_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-primary hover:bg-accent transition-colors"
            >
              GitLab <ExternalLink className="h-3 w-3" />
            </a>
          ) : undefined
        }
      />
      <div className="p-4 space-y-4">
        <div className="rounded-md border border-border bg-surface-1/40 p-3">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <GitCommit className="h-3 w-3" />
            Fix detected
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-sm">
            <span className="font-mono text-primary">{rr.fix_commit}</span>
            <span className="text-foreground/90">{rr.fix_summary}</span>
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Re-run" value={rr.selected_count} tone="info" />
          <Stat label="Passed" value={rr.passed} tone="info" />
          <Stat label="Failed" value={rr.failed} tone="muted" />
          <Stat label="Runtime" value={`~${rr.estimated_seconds}s`} tone="muted" />
        </div>
        <p className="text-2xs text-muted-foreground font-mono">
          pipeline · <span className="text-foreground">{rr.rerun_pipeline_id}</span>
        </p>
      </div>
    </Surface>
  );
}

function BugView({ bug }: { bug: BugArtifact }) {
  return (
    <Surface className="border-success/30">
      <SurfaceHeader
        icon={<Bug className="h-4 w-4 text-success" />}
        title={
          <span className="flex items-center gap-2">
            Bug filed
            <span className="font-mono text-2xs text-primary">{bug.jira_key}</span>
          </span>
        }
        subtitle={bug.title}
        right={
          <a
            href={bug.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-primary hover:bg-accent transition-colors"
          >
            Open in Jira <ExternalLink className="h-3 w-3" />
          </a>
        }
      />
      <div className="p-4">
        <pre className="whitespace-pre-wrap text-sm font-sans text-foreground/90">
          {bug.body_markdown}
        </pre>
      </div>
    </Surface>
  );
}

/* ---------- tiny primitives ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {title}
      </p>
      {children}
    </section>
  );
}

function CodeBlock({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface-1/40 overflow-hidden">
      {label && (
        <div className="border-b border-border bg-surface-2/60 px-3 py-1.5 text-2xs font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
}

function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "info" | "warning" | "danger" | "success";
}) {
  const cls =
    tone === "info"
      ? "border-info/40 bg-info/10 text-info"
      : tone === "warning"
        ? "border-warning/40 bg-warning/10 text-warning"
        : tone === "danger"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : tone === "success"
            ? "border-success/40 bg-success/10 text-success"
            : "border-border bg-muted/40 text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-2xs font-medium",
        cls,
      )}
    >
      {children}
    </span>
  );
}
