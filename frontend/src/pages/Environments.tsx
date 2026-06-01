import { ArrowUpRight, CheckCircle2, GitBranch, Globe2, Loader2, ServerCog } from "lucide-react";

import { KpiCard } from "@/components/KpiCard";
import { MockedChip } from "@/components/MockedChip";
import { cn } from "@/lib/utils";
import { PageHeader, Panel } from "@/pages/Dashboard";

interface EnvRow {
  env: "dev" | "staging" | "prod";
  label: string;
  url: string;
  status: "healthy" | "deploying" | "degraded";
  branch: string;
  pass: number;
  fail: number;
  flaky: number;
  lastRun: string;
  lastDeploy: string;
}

const ENVS: EnvRow[] = [
  {
    env: "dev",
    label: "Development",
    url: "dev.agenticqa.internal",
    status: "healthy",
    branch: "feat/login-pw-tests",
    pass: 142,
    fail: 0,
    flaky: 1,
    lastRun: "5 min ago",
    lastDeploy: "12 min ago",
  },
  {
    env: "staging",
    label: "Staging",
    url: "staging.agenticqa.internal",
    status: "deploying",
    branch: "release/2026-05-29",
    pass: 138,
    fail: 0,
    flaky: 2,
    lastRun: "2 h ago",
    lastDeploy: "just now",
  },
  {
    env: "prod",
    label: "Production",
    url: "agenticqa.app",
    status: "healthy",
    branch: "main",
    pass: 136,
    fail: 0,
    flaky: 0,
    lastRun: "11 h ago",
    lastDeploy: "yesterday",
  },
];

const STATUS_TONE: Record<EnvRow["status"], "success" | "info" | "warning"> = {
  healthy: "success",
  deploying: "info",
  degraded: "warning",
};

export function EnvironmentsPage() {
  return (
    <div className="space-y-5 p-6 lg:p-8">
      <PageHeader
        title="Environments"
        subtitle="Promotion lanes for generated test suites — dev / staging / prod."
        action={<MockedChip label="synthetic env data" />}
      />

      <section className="grid grid-cols-3 gap-3">
        {ENVS.map((e) => (
          <KpiCard
            key={e.env}
            label={e.label}
            value={
              <span className="inline-flex items-center gap-2">
                <span className="font-mono text-2xl">
                  {e.pass}
                  <span className="text-muted-foreground text-xl">/{e.pass + e.fail}</span>
                </span>
                {e.status === "deploying" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-info" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
              </span>
            }
            hint={
              <>
                <span className="font-mono">{e.url}</span> · {e.lastRun}
              </>
            }
            icon={Globe2}
            tone={STATUS_TONE[e.status]}
          />
        ))}
      </section>

      <Panel
        title="Promotion pipeline"
        subtitle="Generated tests flow dev → staging → prod with reviewer approval at each gate."
      >
        <div className="relative overflow-x-auto px-6 py-8">
          <svg viewBox="0 0 800 160" className="w-full h-40">
            {ENVS.map((e, i) => {
              const cx = 130 + i * 270;
              const cy = 80;
              const tone =
                e.status === "healthy"
                  ? "hsl(152 64% 48%)"
                  : e.status === "deploying"
                    ? "hsl(199 89% 60%)"
                    : "hsl(38 92% 58%)";
              return (
                <g key={e.env}>
                  {i < ENVS.length - 1 && (
                    <>
                      <line
                        x1={cx + 60}
                        y1={cy}
                        x2={cx + 210}
                        y2={cy}
                        stroke="hsl(var(--border))"
                        strokeDasharray="4 5"
                        strokeWidth={1.5}
                        markerEnd="url(#arrowR)"
                      />
                      <text
                        x={cx + 135}
                        y={cy - 8}
                        textAnchor="middle"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 10,
                          fill: "hsl(220 8% 60%)",
                        }}
                      >
                        promote
                      </text>
                    </>
                  )}
                  <defs>
                    <marker
                      id="arrowR"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground)/0.6)" />
                    </marker>
                  </defs>
                  <circle cx={cx} cy={cy} r={50} fill="hsl(240 14% 8%)" stroke={tone} strokeWidth={1.5} />
                  <circle cx={cx + 36} cy={cy - 36} r={6} fill={tone} />
                  <text
                    x={cx}
                    y={cy - 2}
                    textAnchor="middle"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      fill: "hsl(220 14% 96%)",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    {e.env}
                  </text>
                  <text
                    x={cx}
                    y={cy + 14}
                    textAnchor="middle"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 10,
                      fill: tone,
                    }}
                  >
                    {e.status}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </Panel>

      <Panel title="Environment detail" subtitle="Branch, URL, last run, last deploy.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-1/60 text-2xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2">Env</th>
                <th className="text-left font-medium px-3 py-2">URL</th>
                <th className="text-left font-medium px-3 py-2">Branch</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-left font-medium px-3 py-2">Tests</th>
                <th className="text-left font-medium px-3 py-2">Last deploy</th>
                <th className="text-left font-medium px-3 py-2 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ENVS.map((e) => (
                <tr key={e.env} className="hover:bg-accent/40">
                  <td className="px-3 py-2.5 font-mono text-2xs uppercase tracking-wider text-foreground">
                    {e.env}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-info">{e.url}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 font-mono text-2xs text-muted-foreground">
                      <GitBranch className="h-3 w-3" />
                      {e.branch}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs uppercase tracking-wider",
                        e.status === "healthy"
                          ? "border-success/40 bg-success/10 text-success"
                          : e.status === "deploying"
                            ? "border-info/40 bg-info/10 text-info"
                            : "border-warning/40 bg-warning/10 text-warning",
                      )}
                    >
                      {e.status === "deploying" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                      {e.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-2xs">
                    <span className="text-success">{e.pass} pass</span>
                    <span className="mx-1.5 text-muted-foreground">·</span>
                    <span className="text-destructive">{e.fail} fail</span>
                    <span className="mx-1.5 text-muted-foreground">·</span>
                    <span className="text-warning">{e.flaky} flaky</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{e.lastDeploy}</td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-2xs hover:bg-accent transition-colors"
                    >
                      open <ArrowUpRight className="h-2.5 w-2.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <footer className="flex items-center justify-between text-2xs text-muted-foreground rounded-lg border bg-card px-4 py-2.5">
        <span className="inline-flex items-center gap-2">
          <ServerCog className="h-3.5 w-3.5 text-primary" />
          orchestrator publishes to all three environments; promotion is gated by reviewer + suite pass.
        </span>
        <MockedChip />
      </footer>
    </div>
  );
}
