import { ArrowLeft, Copy, GitBranch, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AgentPalette } from "@/components/agent-ide/AgentPalette";
import { EnvLanes } from "@/components/agent-ide/EnvLanes";
import { FlowCanvas } from "@/components/agent-ide/FlowCanvas";
import { Inspector } from "@/components/agent-ide/Inspector";
import { TraceStream } from "@/components/agent-ide/TraceStream";
import { LiveIndicator } from "@/components/LiveIndicator";
import { Skeleton } from "@/components/Skeleton";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { useRun } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { absoluteTime, duration, relativeTime, shortId } from "@/lib/format";
import { buildTrace, defaultSelectedStage, envLanesFor } from "@/lib/mock";
import { synthStage } from "@/lib/stage";
import type { StageName } from "@/lib/types";

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: run, error, loading, isPolling, reload, patch } = useRun(id);
  const [selected, setSelected] = useState<StageName | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sel = useMemo<StageName | null>(() => {
    if (!run) return null;
    return selected ?? defaultSelectedStage(run);
  }, [run, selected]);

  const stage = useMemo(
    () => (run && sel ? run.stages.find((s) => s.name === sel) ?? synthStage(sel) : null),
    [run, sel],
  );

  const trace = useMemo(() => (run ? buildTrace(run) : []), [run]);
  const lanes = useMemo(() => (run ? envLanesFor(run) : []), [run]);

  const handleAction = useCallback(
    async (fn: () => Promise<typeof run>) => {
      setPending(true);
      setActionError(null);
      try {
        const updated = await fn();
        if (updated) {
          patch(updated);
          if (selected && !updated.stages.find((s) => s.name === selected)) {
            setSelected(updated.current_stage);
          }
        }
      } catch (e) {
        setActionError(e instanceof Error ? e.message : String(e));
      } finally {
        setPending(false);
      }
    },
    [patch, selected],
  );

  if (loading && !run) {
    return (
      <div className="p-5 space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (error || !run || !stage) {
    return (
      <div className="p-5">
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">Unable to load run</p>
          <p className="mt-1 text-xs">{error ?? "Not found"}</p>
        </div>
      </div>
    );
  }

  const totalDuration = duration(run.created_at, run.updated_at);

  return (
    <div className="flex h-full min-h-[calc(100vh-3.5rem)] flex-col gap-3 p-3 lg:p-4">
      {/* compact top bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon">
            <Link to="/runs" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <nav className="flex items-center gap-1 text-2xs text-muted-foreground">
            <Link to="/runs" className="hover:text-foreground">
              runs
            </Link>
            <span>/</span>
            <span className="font-mono text-primary">{run.jira_ticket}</span>
            <span>/</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(run.id);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="inline-flex items-center gap-1 font-mono hover:text-foreground"
              title={run.id}
            >
              {shortId(run.id)}
              <Copy className="h-2.5 w-2.5" />
              {copied && <span className="text-success">copied</span>}
            </button>
          </nav>
          <div className="ml-2 hidden md:block h-5 w-px bg-border" />
          <h1 className="ml-2 hidden md:block text-sm font-semibold truncate">{run.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-2xs text-muted-foreground">
            started <span className="text-foreground">{relativeTime(run.created_at)}</span> · {totalDuration}
          </span>
          <StatusPill status={stage.status} />
          <LiveIndicator active={isPolling} />
          <Button size="sm" variant="outline" onClick={reload} disabled={pending}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" variant="outline">
            <GitBranch className="h-3.5 w-3.5" />
            Open PR
          </Button>
        </div>
      </header>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {actionError}
        </div>
      )}

      {/* main 3-pane: palette / canvas / inspector */}
      <div className="grid flex-1 min-h-0 gap-3 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_360px]">
        <AgentPalette
          run={run}
          selected={sel!}
          onSelect={(s) => setSelected(s)}
        />
        <div className="flex flex-col min-h-[420px]">
          <FlowCanvas
            run={run}
            selected={sel!}
            onSelect={(s) => setSelected(s)}
          />
        </div>
        <Inspector
          run={run}
          stage={stage}
          onApprove={(note) =>
            handleAction(() => api.approveStage(run.id, stage.name, note))
          }
          onReject={(note) =>
            handleAction(() => api.rejectStage(run.id, stage.name, note))
          }
          onRetry={() => handleAction(() => api.retryStage(run.id, stage.name))}
          pending={pending}
        />
      </div>

      {/* env promotion lanes */}
      <EnvLanes lanes={lanes} />

      {/* trace stream */}
      <TraceStream run={run} events={trace} onSelect={(s) => setSelected(s)} />

      <footer className="flex items-center justify-between text-2xs text-muted-foreground font-mono px-1">
        <span>
          orchestrator <span className="text-foreground">langgraph</span> · model fleet:{" "}
          <span className="text-foreground">opus 4.7</span>,{" "}
          <span className="text-foreground">sonnet 4.6</span>,{" "}
          <span className="text-foreground">haiku 4.5</span>
        </span>
        <span>last sync · {absoluteTime(run.updated_at)}</span>
      </footer>
    </div>
  );
}
