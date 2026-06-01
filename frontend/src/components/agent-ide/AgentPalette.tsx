import { Cpu } from "lucide-react";

import { StatusDot } from "@/components/StatusDot";
import { AGENT_BY_STAGE } from "@/lib/agents";
import { STAGE_ORDER, STATUS_LABELS, getStage } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type { Run, StageName } from "@/lib/types";

interface Props {
  run: Run;
  selected: StageName;
  onSelect: (s: StageName) => void;
}

export function AgentPalette({ run, selected, onSelect }: Props) {
  return (
    <aside className="flex flex-col rounded-lg border bg-card overflow-hidden">
      <header className="flex items-center justify-between border-b border-border bg-surface-1/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-2xs font-semibold uppercase tracking-wider">Agents</h2>
        </div>
        <span className="font-mono text-2xs text-muted-foreground">{STAGE_ORDER.length}</span>
      </header>
      <ul className="flex-1 overflow-y-auto">
        {STAGE_ORDER.map((name, i) => {
          const def = AGENT_BY_STAGE[name];
          const stage = getStage(run.stages, name);
          const isSelected = selected === name;
          const isCurrent = run.current_stage === name;
          const Glyph = def.glyph;
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() => onSelect(name)}
                className={cn(
                  "group w-full text-left flex items-stretch gap-2 border-l-2 px-2.5 py-2 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-accent/50",
                )}
              >
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <StatusDot status={stage.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Glyph className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <p className={cn("text-xs font-medium truncate", isSelected ? "text-foreground" : "text-foreground/90")}>
                      {def.name}
                    </p>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {def.short} · {STATUS_LABELS[stage.status]}
                    {isCurrent && <span className="text-primary"> · current</span>}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <footer className="border-t border-border bg-surface-1/40 px-3 py-2 text-2xs text-muted-foreground space-y-0.5">
        <p className="flex items-center justify-between">
          <span>orchestrator</span>
          <span className="font-mono text-foreground">langgraph</span>
        </p>
        <p className="flex items-center justify-between">
          <span>policy</span>
          <span className="font-mono text-foreground">human-in-loop</span>
        </p>
      </footer>
    </aside>
  );
}
