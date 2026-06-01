import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Database,
  Network,
  PlayCircle,
  TimerReset,
  Workflow,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { KpiCard } from "@/components/KpiCard";
import { MockedChip } from "@/components/MockedChip";
import { NewRunWizard } from "@/components/NewRunWizard";
import { Skeleton } from "@/components/Skeleton";
import { StatusDot } from "@/components/StatusDot";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { useRuns, useTickets } from "@/hooks/useApi";
import { AGENTS } from "@/lib/agents";
import { absoluteTime, relativeTime } from "@/lib/format";
import { STAGE_LABELS, isInFlight } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type { RunSummary, StageName } from "@/lib/types";

export function Dashboard() {
  const { data: runs, error: runsError, loading: runsLoading } = useRuns(5000);
  const { data: tickets } = useTickets();

  const kpis = useMemo(() => computeKpis(runs ?? []), [runs]);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Mission control"
        subtitle="Live status of the autonomous QE fleet — agents in flight, knowledge served, environments healthy."
        action={tickets ? <NewRunWizard tickets={tickets} /> : null}
      />

      {runsError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">Cannot reach backend</p>
          <p className="mt-1 text-xs">{runsError}</p>
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Agents online"
          value="7 / 7"
          hint="orchestrator: langgraph · human-in-loop"
          icon={Bot}
          tone="success"
        />
        <KpiCard
          label="Active runs"
          value={kpis.active}
          hint={kpis.active > 0 ? "stages moving" : "all stages idle"}
          icon={Activity}
          tone={kpis.active > 0 ? "info" : "default"}
        />
        <KpiCard
          label="Awaiting review"
          value={kpis.awaiting}
          hint={kpis.awaiting > 0 ? "human approval pending" : "queue clear"}
          icon={TimerReset}
          tone={kpis.awaiting > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Errored stages"
          value={kpis.errored}
          hint={kpis.errored > 0 ? "retry available" : "no failures"}
          icon={AlertTriangle}
          tone={kpis.errored > 0 ? "danger" : "default"}
        />
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniKpi
          icon={Database}
          label="RAG queries · 24h"
          value="1,284"
          hint="avg 214ms"
          mocked
        />
        <MiniKpi
          icon={Network}
          label="Vector dim"
          value="3,072"
          hint="text-embedding-3-large"
          mocked
        />
        <MiniKpi
          icon={Zap}
          label="Avg agent latency"
          value="2.4s"
          hint="opus + sonnet mix"
          mocked
        />
        <MiniKpi
          icon={PlayCircle}
          label="Pipeline pass rate"
          value="92%"
          hint="last 50 runs"
          mocked
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Recent runs"
          subtitle="Latest pipeline activity, newest first."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/runs">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        >
          {runsLoading && !runs ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (runs?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Workflow}
              title="No runs yet"
              description="Kick off your first run from a Jira ticket — the agent fleet will walk it through requirements, BDD, Playwright, and pipeline."
              action={tickets ? <NewRunWizard tickets={tickets} /> : null}
              className="m-4"
            />
          ) : (
            <ul className="divide-y divide-border">
              {runs!.slice(0, 6).map((r) => (
                <RecentRunRow key={r.id} run={r} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Agent fleet"
          subtitle="7 specialists, hand-off via approval gates."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/agents">
                Inspect
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        >
          <AgentFleet runs={runs ?? []} />
        </Panel>
      </section>
    </div>
  );
}

function computeKpis(runs: RunSummary[]) {
  const active = runs.filter((r) => isInFlight(r.current_status)).length;
  const awaiting = runs.filter((r) => r.current_status === "awaiting_approval").length;
  const errored = runs.filter((r) => r.current_status === "error").length;
  return { active, awaiting, errored };
}

function MiniKpi({
  icon: Icon,
  label,
  value,
  hint,
  mocked,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  hint: string;
  mocked?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        {mocked && <MockedChip />}
      </div>
      <p className="mt-1 font-mono text-lg tabular-nums">{value}</p>
      <p className="text-2xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function RecentRunRow({ run }: { run: RunSummary }) {
  return (
    <li>
      <Link
        to={`/runs/${run.id}`}
        className="group flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <StatusDot status={run.current_status} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono text-2xs text-primary">{run.jira_ticket}</span>
            <span className="truncate text-foreground">{run.title}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-2xs text-muted-foreground">
            <span>{STAGE_LABELS[run.current_stage]}</span>
            <span>·</span>
            <span title={absoluteTime(run.updated_at)}>{relativeTime(run.updated_at)}</span>
          </div>
        </div>
        <StatusPill status={run.current_status} />
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    </li>
  );
}

function AgentFleet({ runs }: { runs: RunSummary[] }) {
  const activeByStage: Record<StageName, number> = {} as Record<StageName, number>;
  for (const r of runs) {
    if (isInFlight(r.current_status)) {
      activeByStage[r.current_stage] = (activeByStage[r.current_stage] ?? 0) + 1;
    }
  }
  return (
    <ul className="divide-y divide-border">
      {AGENTS.map((def) => {
        const active = activeByStage[def.stage] ?? 0;
        const Glyph = def.glyph;
        return (
          <li key={def.stage} className="flex items-center gap-2.5 px-4 py-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-md border border-border bg-gradient-to-br from-primary/15 to-info/15">
              <Glyph className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium">{def.name}</p>
                <span className="rounded bg-muted/40 px-1 py-px font-mono text-[10px] text-muted-foreground">
                  {def.short}
                </span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">{def.model}</p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider",
                active > 0
                  ? "border-info/40 bg-info/10 text-info"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  active > 0 ? "bg-info live-dot" : "bg-muted-foreground/40",
                )}
              />
              {active > 0 ? `${active} active` : "idle"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
