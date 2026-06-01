import { ArrowRight, CheckCircle2, Loader2, Rocket, RotateCw, ServerCog, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";

import { MockedChip } from "@/components/MockedChip";
import { Button } from "@/components/ui/button";
import { duration, relativeTime } from "@/lib/format";
import type { EnvLane } from "@/lib/mock";
import { cn } from "@/lib/utils";

interface Props {
  lanes: EnvLane[];
}

const ENV_LABEL: Record<EnvLane["env"], string> = {
  dev: "Development",
  staging: "Staging",
  prod: "Production",
};

const STATUS_COLOR: Record<EnvLane["status"], string> = {
  idle: "text-muted-foreground",
  running: "text-info",
  passed: "text-success",
  failed: "text-destructive",
};

const STATUS_BG: Record<EnvLane["status"], string> = {
  idle: "bg-muted/40",
  running: "bg-info/20",
  passed: "bg-success/20",
  failed: "bg-destructive/20",
};

export function EnvLanes({ lanes }: Props) {
  // The dev / staging lanes auto-promote on suite pass; only the prod lane
  // requires an explicit human gate before deploy.
  const staging = lanes.find((l) => l.env === "staging");
  const prod = lanes.find((l) => l.env === "prod");
  const stagingPassed = staging?.status === "passed";
  const prodReady = !!stagingPassed && prod?.status === "idle";
  const viaReRun = lanes.some((l) => l.via === "re_run");

  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);

  return (
    <section className="rounded-lg border bg-card overflow-hidden">
      <header className="flex items-center justify-between border-b border-border bg-surface-1/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <ServerCog className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-2xs font-semibold uppercase tracking-wider">Promotion lanes</h2>
          <MockedChip />
        </div>
        <span className="font-mono text-2xs text-muted-foreground inline-flex items-center gap-2">
          {viaReRun && (
            <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-1.5 py-0.5 text-success">
              <RotateCw className="h-2.5 w-2.5" />
              re-run passed · promoting
            </span>
          )}
          <span>
            dev <span className="text-success">auto</span> → staging <span className="text-success">auto</span> → prod <span className="text-warning">HITL gate</span>
          </span>
        </span>
      </header>

      <ol className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        {lanes.map((lane) => {
          const isProd = lane.env === "prod";
          return (
            <li key={lane.env} className="flex items-center gap-3 p-3">
              <div
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-md border",
                  STATUS_BG[lane.status],
                  STATUS_COLOR[lane.status],
                  "border-current/30",
                )}
              >
                {lane.status === "passed" && <CheckCircle2 className="h-4 w-4" />}
                {lane.status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
                {lane.status === "failed" && <XCircle className="h-4 w-4" />}
                {lane.status === "idle" && (isProd ? <ShieldCheck className="h-4 w-4" /> : <ServerCog className="h-4 w-4" />)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium">{ENV_LABEL[lane.env]}</p>
                  {!isProd && (
                    <span className="rounded-full border border-success/40 bg-success/10 px-1.5 py-px text-[9px] font-mono uppercase tracking-wider text-success">
                      auto
                    </span>
                  )}
                  {isProd && (
                    <span className="rounded-full border border-warning/40 bg-warning/10 px-1.5 py-px text-[9px] font-mono uppercase tracking-wider text-warning">
                      HITL gate
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                  <span className={cn("uppercase tracking-wider", STATUS_COLOR[lane.status])}>
                    {lane.status}
                  </span>
                  {lane.lastRun && <span>· {relativeTime(lane.lastRun)}</span>}
                  {lane.durationMs && (
                    <span>
                      ·{" "}
                      {duration(
                        new Date(Date.now() - lane.durationMs).toISOString(),
                        new Date().toISOString(),
                      )}
                    </span>
                  )}
                  {lane.via === "re_run" && lane.status === "passed" && (
                    <span className="inline-flex items-center gap-0.5 text-success">
                      · via <RotateCw className="h-2.5 w-2.5" /> re-run
                    </span>
                  )}
                </div>
                {(lane.passed > 0 || lane.failed > 0) && (
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-success">{lane.passed} pass</span>
                    <span className="text-destructive">{lane.failed} fail</span>
                  </div>
                )}
              </div>

              {/* Prod-only HITL gate button */}
              {isProd && prodReady && !promoted && (
                <Button
                  size="sm"
                  className="shrink-0 gap-1 shadow-[0_0_18px_-4px_hsl(var(--warning)/0.7)]"
                  disabled={promoting}
                  onClick={() => {
                    setPromoting(true);
                    setTimeout(() => {
                      setPromoting(false);
                      setPromoted(true);
                    }, 1200);
                  }}
                >
                  {promoting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Rocket className="h-3 w-3" />
                  )}
                  Approve → Production
                </Button>
              )}
              {isProd && promoted && (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-2xs text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  promoted
                </span>
              )}
              {isProd && !prodReady && !promoted && (
                <span className="inline-flex items-center gap-1 font-mono text-2xs text-muted-foreground">
                  awaiting staging pass <ArrowRight className="h-3 w-3" />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <footer className="border-t border-border bg-surface-1/40 px-3 py-2 flex items-center justify-between text-2xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-warning" />
          Production deploy requires explicit reviewer approval.
        </span>
        <span className="font-mono">dev · staging · prod</span>
      </footer>
    </section>
  );
}
