import { Check, ChevronRight, CircleDashed, Loader2, OctagonAlert, X } from "lucide-react";

import { STAGE_ICONS, STAGE_LABELS, STAGE_ORDER, STATUS_STYLES } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type { Stage, StageName, StageStatus } from "@/lib/types";

interface Props {
  stages: Stage[];
  current: StageName;
  selected: StageName;
  onSelect: (s: StageName) => void;
}

export function PipelineStrip({ stages, current, selected, onSelect }: Props) {
  const byName = new Map(stages.map((s) => [s.name, s]));
  return (
    <div className="rounded-lg border bg-card p-2">
      <ol className="flex items-stretch gap-1 overflow-x-auto">
        {STAGE_ORDER.map((name, idx) => {
          const stage = byName.get(name)!;
          const isCurrent = name === current;
          const isSelected = name === selected;
          const Icon = STAGE_ICONS[name];
          const style = STATUS_STYLES[stage.status];
          return (
            <li key={name} className="flex items-stretch flex-1 min-w-[160px]">
              <button
                type="button"
                onClick={() => onSelect(name)}
                className={cn(
                  "group flex w-full flex-col items-start gap-1.5 rounded-md border px-3 py-2 text-left transition-all",
                  isSelected
                    ? cn("border-primary/60 bg-primary/5", isCurrent && "ring-1 ring-primary/40")
                    : "border-transparent hover:bg-accent/60",
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-2xs font-mono uppercase tracking-wider text-muted-foreground">
                    <span className="rounded bg-muted/40 px-1.5 py-0.5">{String(idx + 1).padStart(2, "0")}</span>
                    <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                  </span>
                  <StatusGlyph status={stage.status} />
                </div>
                <div className="w-full">
                  <p
                    className={cn(
                      "text-sm leading-tight truncate",
                      isSelected ? "text-foreground font-medium" : "text-foreground/90",
                    )}
                  >
                    {STAGE_LABELS[name]}
                  </p>
                  <p className={cn("mt-0.5 text-2xs uppercase tracking-wide", style.text)}>
                    {stage.status.replace(/_/g, " ")}
                  </p>
                </div>
                <div className={cn("mt-1 h-0.5 w-full rounded-full", segmentBg(stage.status))} />
              </button>
              {idx < STAGE_ORDER.length - 1 && (
                <span className="hidden md:flex items-center px-0.5 text-muted-foreground/40">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function segmentBg(status: StageStatus): string {
  switch (status) {
    case "approved":
      return "bg-success";
    case "running":
      return "bg-info";
    case "awaiting_approval":
      return "bg-warning";
    case "error":
    case "rejected":
      return "bg-destructive";
    case "skipped":
      return "bg-muted-foreground/30";
    default:
      return "bg-border";
  }
}

function StatusGlyph({ status }: { status: StageStatus }) {
  const cls = "h-3.5 w-3.5";
  switch (status) {
    case "approved":
      return <Check className={cn(cls, "text-success")} />;
    case "running":
      return <Loader2 className={cn(cls, "text-info animate-spin")} />;
    case "awaiting_approval":
      return <span className={cn(cls, "rounded-full bg-warning/80")} />;
    case "rejected":
      return <X className={cn(cls, "text-destructive")} />;
    case "error":
      return <OctagonAlert className={cn(cls, "text-destructive")} />;
    case "skipped":
      return <CircleDashed className={cn(cls, "text-muted-foreground/60")} />;
    default:
      return <span className={cn(cls, "rounded-full border border-border")} />;
  }
}
