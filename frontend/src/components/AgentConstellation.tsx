import { Sparkles } from "lucide-react";

import { AGENTS } from "@/lib/agents";
import { cn } from "@/lib/utils";

interface Props {
  size?: number;
  className?: string;
}

/**
 * A 3D orbiting constellation of the 7 agents around a pulsing orchestrator core.
 * Pure CSS 3D — slow Y-axis spin, pauses on hover.
 */
export function AgentConstellation({ size = 360, className }: Props) {
  const radius = size * 0.42;

  return (
    <div
      className={cn("orbit-stage relative", className)}
      style={{ width: size, height: size }}
    >
      {/* Radiating spoke lines (static, behind orbit) */}
      <svg
        className="absolute inset-0 pointer-events-none"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="ring-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(263 80% 64% / 0.2)" />
            <stop offset="100%" stopColor="hsl(263 80% 64% / 0)" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="100" rx="80" ry="28" fill="none" stroke="hsl(263 80% 64% / 0.35)" strokeDasharray="2 4" />
        <ellipse cx="100" cy="100" rx="86" ry="32" fill="url(#ring-grad)" />
      </svg>

      <div className="orbit-spin absolute inset-0">
        {/* Orchestrator core */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transform: "translate3d(-50%, -50%, 0)" }}
        >
          <div className="core-pulse grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary via-primary/70 to-info border border-primary/60">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="mt-2 text-center font-mono text-2xs uppercase tracking-widest text-primary/90">
            Orchestrator
          </p>
        </div>

        {/* Orbiting agent nodes */}
        {AGENTS.map((a, i) => {
          const angle = (i / AGENTS.length) * 360;
          const Glyph = a.glyph;
          return (
            <div
              key={a.short}
              className="orbit-node absolute left-1/2 top-1/2"
              style={{
                transform: `translate3d(-50%, -50%, 0) rotateY(${angle}deg) translateZ(${radius}px)`,
              }}
            >
              <div
                className="grid h-14 w-14 place-items-center rounded-full border border-primary/50 bg-gradient-to-br from-surface-2 to-surface-1 shadow-[0_0_18px_-4px_hsl(var(--primary)/0.7)]"
                style={{ transform: `rotateY(-${angle}deg)` }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <Glyph className="h-4 w-4 text-foreground" />
                  <span className="font-mono text-[9px] font-bold tracking-widest text-primary">
                    {a.short}
                  </span>
                </div>
              </div>
              <p
                className="mt-1 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground whitespace-nowrap"
                style={{ transform: `rotateY(-${angle}deg)` }}
              >
                {a.name.replace(" Agent", "")}
              </p>
            </div>
          );
        })}
      </div>

      {/* drifting particles */}
      <div className="drift">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${5 + ((i * 37) % 90)}%`,
              bottom: `${(i * 13) % 50}%`,
              animationDuration: `${6 + (i % 6)}s`,
              animationDelay: `${(i * 0.4) % 6}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
