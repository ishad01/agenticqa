import { Cpu, Database, Sparkles, Wrench } from "lucide-react";

import { MockedChip } from "@/components/MockedChip";
import { Skeleton } from "@/components/Skeleton";
import { useRuns } from "@/hooks/useApi";
import { AGENTS, type AgentDefinition } from "@/lib/agents";
import { STATUS_STYLES } from "@/lib/stage";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/pages/Dashboard";

export function AgentsPage() {
  const { data: runs, loading } = useRuns(8000);

  // Mock per-agent stats from real runs
  const stats = (def: AgentDefinition) => {
    const stagedRuns = (runs ?? []).map((r) =>
      r.current_stage === def.stage ? r.current_status : null,
    );
    const activeCount = stagedRuns.filter((s) => s === "running" || s === "awaiting_approval").length;
    const errCount = stagedRuns.filter((s) => s === "error").length;
    return {
      activeCount,
      errCount,
      avgLatencyMs: 800 + def.stage.length * 220, // synthesized
      runsHandled: 142 + def.short.charCodeAt(0),
      successRate: 0.94 - def.short.charCodeAt(0) / 5000,
    };
  };

  return (
    <div className="space-y-5 p-6 lg:p-8">
      <PageHeader
        title="Agents"
        subtitle="Every autonomous QE agent in the fleet — its model, tools, RAG indexes, and live activity."
        action={
          <span className="inline-flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-2.5 py-1 text-xs text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
            7 / 7 online
          </span>
        }
      />

      {loading && !runs ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {AGENTS.map((def) => {
            const s = stats(def);
            const Glyph = def.glyph;
            return (
              <article
                key={def.stage}
                className="relative overflow-hidden rounded-lg border bg-card p-4"
              >
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary to-info" />
                <header className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md border bg-gradient-to-br from-primary/20 to-info/20 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)]">
                    <Glyph className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold">{def.name}</h3>
                      <span className="rounded bg-muted/40 px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                        {def.short}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{def.role}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs",
                      s.activeCount > 0
                        ? STATUS_STYLES.running.text + " " + STATUS_STYLES.running.bg + " " + STATUS_STYLES.running.border
                        : "border-border bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        s.activeCount > 0 ? "bg-info live-dot" : "bg-muted-foreground/40",
                      )}
                    />
                    {s.activeCount > 0 ? `${s.activeCount} active` : "idle"}
                  </span>
                </header>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-2xs">
                  <Stat label="Model" value={<span className="font-mono">{def.model}</span>} />
                  <Stat
                    label="Runs handled"
                    value={
                      <span className="font-mono">
                        {s.runsHandled} <MockedChip />
                      </span>
                    }
                  />
                  <Stat
                    label="Avg latency"
                    value={
                      <span className="font-mono">
                        {(s.avgLatencyMs / 1000).toFixed(1)}s <MockedChip />
                      </span>
                    }
                  />
                  <Stat
                    label="Success rate"
                    value={
                      <span className="font-mono text-success">
                        {(s.successRate * 100).toFixed(1)}%
                      </span>
                    }
                  />
                  <Stat label="Temp" value={<span className="font-mono">{def.temperature}</span>} />
                  <Stat
                    label="Max tokens"
                    value={<span className="font-mono">{def.maxTokens.toLocaleString()}</span>}
                  />
                </dl>

                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                      <Wrench className="h-2.5 w-2.5" />
                      Tools ({def.tools.length})
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {def.tools.map((t) => (
                        <span
                          key={t.name}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-px font-mono text-[10px] text-primary"
                        >
                          <t.icon className="h-2.5 w-2.5" />
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {def.ragIndexes.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                        <Database className="h-2.5 w-2.5" />
                        RAG indexes
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {def.ragIndexes.map((i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full border border-info/30 bg-info/10 px-1.5 py-px font-mono text-[10px] text-info"
                          >
                            <Database className="h-2.5 w-2.5" />
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <footer className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span>
            Agents are orchestrated by <span className="font-mono text-foreground">langgraph</span>;
            human-in-the-loop gates between every stage.
          </span>
          <Sparkles className="h-3.5 w-3.5 text-primary ml-2" />
          <span>Per-agent stats are synthesized — backend telemetry pipeline pending.</span>
        </p>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface-1/40 p-1.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}
