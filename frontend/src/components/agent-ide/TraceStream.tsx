import { ChevronDown, ChevronRight, ChevronUp, Filter, Maximize2, Minimize2, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { MockedChip } from "@/components/MockedChip";
import { AGENT_BY_STAGE, type TraceEvent } from "@/lib/agents";
import { cn } from "@/lib/utils";
import type { Run, StageName } from "@/lib/types";

interface Props {
  run: Run;
  events: TraceEvent[];
  onSelect?: (s: StageName) => void;
}

const OP_COLORS: Record<TraceEvent["op"], string> = {
  thinking: "text-muted-foreground",
  tool_call: "text-primary",
  retrieve: "text-info",
  embed: "text-info",
  generate: "text-success",
  approved: "text-success",
  rejected: "text-destructive",
  error: "text-destructive",
};

export function TraceStream({ run, events, onSelect }: Props) {
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState<TraceEvent["op"] | "all">("all");
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => events.filter((e) => filter === "all" || e.op === filter),
    [events, filter],
  );

  useEffect(() => {
    if (!live || !ref.current || !expanded) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [filtered, live, expanded]);

  const baseTime = new Date(run.created_at).getTime();

  return (
    <section className="flex flex-col rounded-lg border bg-card overflow-hidden">
      <header
        className={cn(
          "flex items-center justify-between gap-3 border-b border-border bg-surface-1/60 px-3 py-1.5 cursor-pointer hover:bg-accent/30 transition-colors",
          !expanded && "border-b-transparent",
        )}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground rotate-180" />
          )}
          <h2 className="text-2xs font-semibold uppercase tracking-wider">Trace stream</h2>
          <MockedChip />
          <span className="font-mono text-2xs text-muted-foreground">
            · {events.length} events
          </span>
          {!expanded && (
            <span className="font-mono text-2xs text-muted-foreground hidden sm:inline">
              · click to expand
            </span>
          )}
        </div>
        {expanded ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <FilterChip value="all" current={filter} onClick={setFilter}>
              all
            </FilterChip>
            <FilterChip value="retrieve" current={filter} onClick={setFilter}>
              rag
            </FilterChip>
            <FilterChip value="tool_call" current={filter} onClick={setFilter}>
              tools
            </FilterChip>
            <FilterChip value="generate" current={filter} onClick={setFilter}>
              generate
            </FilterChip>
            <FilterChip value="error" current={filter} onClick={setFilter}>
              errors
            </FilterChip>
            <button
              type="button"
              onClick={() => setLive((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider transition-colors ml-1",
                live
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {live ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
              {live ? "live" : "paused"}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:bg-accent transition-colors"
              title="Collapse"
            >
              <Minimize2 className="h-2.5 w-2.5" />
              collapse
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:bg-accent transition-colors"
            title="Expand trace stream"
          >
            <Maximize2 className="h-2.5 w-2.5" />
            maximise
          </button>
        )}
      </header>
      {!expanded ? null : (
      <div ref={ref} className="max-h-[260px] overflow-y-auto bg-[hsl(240_14%_5%)] font-mono text-[11px]">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Filter className="mx-auto h-3.5 w-3.5" />
            <p className="mt-1">No events match this filter yet.</p>
          </div>
        ) : (
          <ul>
            {filtered.map((e, i) => {
              const def = AGENT_BY_STAGE[e.agent];
              const ts = new Date(baseTime + e.ts);
              const tsStr = ts.toISOString().slice(11, 23);
              return (
                <li
                  key={i}
                  onClick={() => onSelect?.(e.agent)}
                  className="grid grid-cols-[80px_auto_56px_auto_1fr_56px] items-center gap-2 px-3 py-1 hover:bg-accent/30 cursor-pointer border-b border-border/30"
                >
                  <span className="text-muted-foreground">{tsStr}</span>
                  <span className="text-foreground/80 truncate">{def.short.toLowerCase()}</span>
                  <span
                    className={cn(
                      "rounded border border-border/40 bg-muted/40 px-1 py-px text-[9px] uppercase tracking-wider",
                      OP_COLORS[e.op],
                    )}
                  >
                    {e.op === "tool_call" ? "tool" : e.op}
                  </span>
                  {e.tool ? (
                    <span className="text-primary truncate">{e.tool}</span>
                  ) : (
                    <span />
                  )}
                  <span className="truncate text-foreground/90">
                    {e.label}
                    {e.detail && (
                      <>
                        <ChevronRight className="inline h-2.5 w-2.5 mx-1 text-muted-foreground" />
                        <span className="text-muted-foreground">{e.detail}</span>
                      </>
                    )}
                  </span>
                  <span className="text-right text-muted-foreground tabular-nums">
                    {e.durationMs ? `${e.durationMs}ms` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      )}
    </section>
  );
}

function FilterChip<T extends string>({
  value,
  current,
  onClick,
  children,
}: {
  value: T;
  current: T;
  onClick: (v: T) => void;
  children: React.ReactNode;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider transition-colors",
        active
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
