import { useMemo } from "react";

import { AGENT_BY_STAGE } from "@/lib/agents";
import { defaultLayout } from "@/lib/mock";
import { STAGE_LABELS, STAGE_ORDER, STATUS_STYLES, getStage } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type { Run, Stage, StageName, StageStatus } from "@/lib/types";

interface Props {
  run: Run;
  selected: StageName;
  onSelect: (s: StageName) => void;
}

const W = 1000;
const H = 460;
const R = 38;

const STATUS_FILL: Record<StageStatus, string> = {
  approved: "hsl(152 64% 48%)",
  running: "hsl(199 89% 60%)",
  awaiting_approval: "hsl(38 92% 58%)",
  rejected: "hsl(0 78% 58%)",
  error: "hsl(0 78% 58%)",
  pending: "hsl(240 8% 30%)",
  skipped: "hsl(240 8% 30%)",
};

const STATUS_GLOW: Record<StageStatus, string> = {
  approved: "hsl(152 64% 48% / 0.55)",
  running: "hsl(199 89% 60% / 0.65)",
  awaiting_approval: "hsl(38 92% 58% / 0.55)",
  rejected: "hsl(0 78% 58% / 0.5)",
  error: "hsl(0 78% 58% / 0.5)",
  pending: "hsl(240 8% 50% / 0.0)",
  skipped: "hsl(240 8% 50% / 0.0)",
};

export function FlowCanvas({ run, selected, onSelect }: Props) {
  const nodes = useMemo(() => {
    const layout = defaultLayout();
    return layout.map((p) => ({
      ...p,
      stage: getStage(run.stages, p.stage),
      def: AGENT_BY_STAGE[p.stage],
      px: p.x * W,
      py: p.y * H,
    }));
  }, [run]);

  const edges = useMemo(() => {
    const pairs: { from: StageName; to: StageName }[] = [];
    for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
      pairs.push({ from: STAGE_ORDER[i], to: STAGE_ORDER[i + 1] });
    }
    return pairs;
  }, []);

  const byStage = new Map(nodes.map((n) => [n.stage.name, n]));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border bg-[radial-gradient(ellipse_at_center,_hsl(263_60%_15%/0.35)_0%,_hsl(240_14%_5%)_70%)]">
      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)/0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="relative h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground)/0.55)" />
          </marker>
          <linearGradient id="edge-flow" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="hsl(263 80% 64% / 0.0)" />
            <stop offset="40%" stopColor="hsl(263 80% 64% / 0.9)" />
            <stop offset="60%" stopColor="hsl(199 89% 60% / 0.9)" />
            <stop offset="100%" stopColor="hsl(199 89% 60% / 0.0)" />
          </linearGradient>

          {nodes.map((n) => (
            <radialGradient
              key={n.stage.name + "-grad"}
              id={`grad-${n.stage.name}`}
              cx="50%"
              cy="40%"
              r="80%"
            >
              <stop offset="0%" stopColor={STATUS_FILL[n.stage.status]} stopOpacity={0.95} />
              <stop offset="100%" stopColor="hsl(240 14% 8%)" stopOpacity={1} />
            </radialGradient>
          ))}
        </defs>

        {/* edges */}
        {edges.map(({ from, to }, i) => {
          const a = byStage.get(from)!;
          const b = byStage.get(to)!;
          const flowing =
            a.stage.status === "approved" &&
            (b.stage.status === "running" ||
              b.stage.status === "awaiting_approval" ||
              b.stage.status === "approved");
          const path = curvedPath(a.px, a.py, b.px, b.py);
          return (
            <g key={i}>
              <path
                d={path}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={1.5}
                strokeDasharray="4 5"
                markerEnd="url(#arrow)"
              />
              {flowing && (
                <path
                  d={path}
                  fill="none"
                  stroke="url(#edge-flow)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-60"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-dasharray"
                    values="60 200;60 200"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </path>
              )}
            </g>
          );
        })}

        {/* knowledge-cluster: orbiting tool nodes around the selected agent */}
        {byStage.get(selected) && (
          <KnowledgeCluster node={byStage.get(selected)!} />
        )}

        {/* nodes */}
        {nodes.map((n) => (
          <AgentNode
            key={n.stage.name}
            cx={n.px}
            cy={n.py}
            label={STAGE_LABELS[n.stage.name]}
            short={n.def.short}
            stage={n.stage}
            isSelected={selected === n.stage.name}
            isCurrent={n.stage.name === run.current_stage}
            onClick={() => onSelect(n.stage.name)}
          />
        ))}
      </svg>

      <CanvasLegend />
    </div>
  );
}

function curvedPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mx = x1 + dx * 0.5;
  // bias control points so curve never collides with nodes
  const cx1 = mx + (dy === 0 ? 0 : dy > 0 ? 30 : -30);
  const cx2 = mx - (dy === 0 ? 0 : dy > 0 ? 30 : -30);
  return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
}

function AgentNode({
  cx,
  cy,
  label,
  short,
  stage,
  isSelected,
  isCurrent,
  onClick,
}: {
  cx: number;
  cy: number;
  label: string;
  short: string;
  stage: Stage;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const glow = STATUS_GLOW[stage.status];
  const fill = STATUS_FILL[stage.status];
  const isActive = stage.status === "running" || stage.status === "awaiting_approval";

  return (
    <g
      className="cursor-pointer"
      onClick={onClick}
      style={{ filter: isActive ? `drop-shadow(0 0 12px ${glow})` : undefined }}
    >
      {/* halo */}
      {(isSelected || isActive) && (
        <circle
          cx={cx}
          cy={cy}
          r={R + 10}
          fill="none"
          stroke={fill}
          strokeOpacity={0.45}
          strokeWidth={1.5}
        >
          {isActive && (
            <animate
              attributeName="r"
              values={`${R + 6};${R + 18};${R + 6}`}
              dur="2.2s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      )}

      {/* main disc */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill={`url(#grad-${stage.name})`}
        stroke={isSelected ? "hsl(263 80% 64%)" : "hsl(var(--border))"}
        strokeWidth={isSelected ? 2 : 1}
      />

      {/* status dot */}
      <circle cx={cx + R - 8} cy={cy - R + 8} r={5} fill={fill} stroke="hsl(240 14% 6%)" strokeWidth={1.5} />

      {/* short code */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        className="select-none"
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: 13,
          fontWeight: 700,
          fill: "hsl(220 14% 96%)",
          letterSpacing: 1,
        }}
      >
        {short}
      </text>

      {/* label below */}
      <text
        x={cx}
        y={cy + R + 18}
        textAnchor="middle"
        className="select-none"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
          fontWeight: 500,
          fill: isSelected ? "hsl(220 14% 96%)" : "hsl(220 8% 65%)",
        }}
      >
        {label}
      </text>

      {/* status text */}
      <text
        x={cx}
        y={cy + R + 32}
        textAnchor="middle"
        className="select-none uppercase"
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 9,
          fill: fill,
          letterSpacing: 1,
        }}
      >
        {stage.status.replace(/_/g, " ")}
      </text>

      {isCurrent && (
        <rect
          x={cx - 28}
          y={cy - R - 22}
          width={56}
          height={14}
          rx={3}
          fill="hsl(263 80% 64% / 0.18)"
          stroke="hsl(263 80% 64%)"
          strokeWidth={0.8}
        />
      )}
      {isCurrent && (
        <text
          x={cx}
          y={cy - R - 11}
          textAnchor="middle"
          className="select-none"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 8,
            fill: "hsl(263 80% 80%)",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          current
        </text>
      )}
    </g>
  );
}

function KnowledgeCluster({
  node,
}: {
  node: { px: number; py: number; def: { tools: { name: string }[]; ragIndexes: string[] } };
}) {
  const tools = node.def.tools.slice(0, 4);
  const indexes = node.def.ragIndexes;
  const items: { label: string; kind: "tool" | "rag" }[] = [
    ...tools.map((t) => ({ label: t.name, kind: "tool" as const })),
    ...indexes.map((i) => ({ label: i, kind: "rag" as const })),
  ];
  if (items.length === 0) return null;

  const baseR = 110;
  return (
    <g>
      <circle
        cx={node.px}
        cy={node.py}
        r={baseR}
        fill="none"
        stroke="hsl(263 80% 64% / 0.18)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
      {items.map((item, i) => {
        const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2;
        const x = node.px + Math.cos(angle) * baseR;
        const y = node.py + Math.sin(angle) * baseR;
        const fill = item.kind === "rag" ? "hsl(199 89% 60%)" : "hsl(263 80% 64%)";
        return (
          <g key={item.label + i}>
            <line
              x1={node.px}
              y1={node.py}
              x2={x}
              y2={y}
              stroke={fill}
              strokeOpacity={0.18}
              strokeWidth={1}
            />
            <rect
              x={x - 36}
              y={y - 8}
              width={72}
              height={16}
              rx={4}
              fill="hsl(240 14% 8%)"
              stroke={fill}
              strokeOpacity={0.7}
            />
            <text
              x={x}
              y={y + 3}
              textAnchor="middle"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 8,
                fill: "hsl(220 14% 90%)",
              }}
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function CanvasLegend() {
  const items: { label: string; status: StageStatus }[] = [
    { label: "approved", status: "approved" },
    { label: "running", status: "running" },
    { label: "awaiting", status: "awaiting_approval" },
    { label: "error", status: "error" },
    { label: "pending", status: "pending" },
  ];
  return (
    <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-md border border-border bg-card/80 px-3 py-1.5 backdrop-blur text-2xs">
      {items.map((i) => (
        <span key={i.status} className={cn("inline-flex items-center gap-1.5", STATUS_STYLES[i.status].text)}>
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: STATUS_FILL[i.status] }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
