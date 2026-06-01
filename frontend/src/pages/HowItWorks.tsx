import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  GitPullRequest,
  Network,
  PlayCircle,
  Server,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { AgentConstellation } from "@/components/AgentConstellation";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { MockedChip } from "@/components/MockedChip";
import { Button } from "@/components/ui/button";
import { useRuns, useTickets } from "@/hooks/useApi";
import { AGENTS } from "@/lib/agents";
import { cn } from "@/lib/utils";

export function HowItWorksPage() {
  const { data: runs, error: runsError } = useRuns(6000);
  const { data: tickets } = useTickets();
  const backendUp = !runsError;

  return (
    <div className="scan-bg min-h-screen">
      <Drift count={28} />

      <div className="relative space-y-16 p-6 lg:p-10 max-w-[1400px] mx-auto">
        {/* ───────── Hero — split: copy left, 3D constellation right ───────── */}
        <Reveal>
          <section className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-center pt-6">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-2xs font-mono uppercase tracking-wider text-primary">
                  <Sparkles className="h-2.5 w-2.5" />
                  How it works
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-mono uppercase tracking-wider",
                    backendUp
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-destructive/40 bg-destructive/10 text-destructive",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      backendUp ? "bg-success live-dot" : "bg-destructive",
                    )}
                  />
                  {backendUp ? "system live" : "backend offline"}
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.05]">
                Autonomous QE,{" "}
                <span className="bg-gradient-to-r from-primary via-info to-primary bg-clip-text text-transparent">
                  in flight.
                </span>
              </h1>
              <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
                Seven specialist agents orbit a LangGraph orchestrator. They take a Jira story all
                the way through requirements → test case creation → automation → CI run →
                triage → defect filed — pausing at every gate for your review, grounded by RAG over
                your codebase and design docs.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button asChild>
                  <Link to="/runs">
                    <Workflow className="h-4 w-4" />
                    See live runs
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/agents">
                    <Bot className="h-4 w-4" />
                    Inspect agents
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/tickets">
                    <GitPullRequest className="h-4 w-4" />
                    Start a run
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative flex items-center justify-center min-h-[440px]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-info/10 blur-3xl pointer-events-none" />
              <AgentConstellation size={420} className="float" />
            </div>
          </section>
        </Reveal>

        {/* ───────── Live status ───────── */}
        <Reveal delay={80}>
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <LiveStat
              icon={Server}
              label="Backend"
              value={backendUp ? "online" : "offline"}
              hint="FastAPI · 127.0.0.1:8000"
              tone={backendUp ? "success" : "danger"}
            />
            <LiveStat
              icon={Bot}
              label="Agents"
              value="7 / 7"
              hint="orchestrated by langgraph"
              tone="success"
            />
            <LiveStat
              icon={Workflow}
              label="Runs in flight"
              value={`${runs?.filter((r) => r.current_status === "running" || r.current_status === "awaiting_approval").length ?? 0}`}
              hint={`${runs?.length ?? 0} total`}
              tone="info"
            />
            <LiveStat
              icon={Database}
              label="Vector indexes"
              value="7"
              hint="35,397 vectors · text-embedding-3"
              tone="info"
              mocked
            />
            <LiveStat
              icon={ShieldCheck}
              label="HITL gates"
              value={`${runs?.filter((r) => r.current_status === "awaiting_approval").length ?? 0} open`}
              hint={`${tickets?.length ?? 0} tickets seeded`}
              tone="warning"
            />
          </section>
        </Reveal>

        {/* ───────── 3D architecture stage ───────── */}
        <Reveal delay={140}>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">System topology</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Four layers · sources → orchestration → agents → ship.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-2xs text-muted-foreground">
                <Network className="h-3 w-3" />
                interactive
              </span>
            </div>

            <div className="stage-3d">
              <div className="tilt-3d">
                <ArchitectureDiagram />
              </div>
            </div>
          </section>
        </Reveal>

        {/* ───────── 7-stage flow cards ───────── */}
        <Reveal delay={180}>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">The 7-stage flow</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Every run walks through these — gated by you between each.
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/agents">
                  All agents
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {AGENTS.map((a, i) => {
                const Glyph = a.glyph;
                return (
                  <li
                    key={a.stage}
                    className="glass glow-edge relative overflow-hidden rounded-xl p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xs text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="grid h-9 w-9 place-items-center rounded-md border border-primary/40 bg-gradient-to-br from-primary/20 to-info/20 shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)]">
                        <Glyph className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{a.name}</p>
                        <p className="font-mono text-2xs text-muted-foreground">{a.short}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{a.role}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="rounded border border-border bg-muted/40 px-1.5 py-px font-mono text-2xs text-muted-foreground">
                        {a.model}
                      </span>
                      {a.ragIndexes.slice(0, 2).map((idx) => (
                        <span
                          key={idx}
                          className="rounded border border-info/30 bg-info/10 px-1.5 py-px font-mono text-2xs text-info"
                        >
                          {idx}
                        </span>
                      ))}
                      {a.ragIndexes.length > 2 && (
                        <span className="font-mono text-2xs text-muted-foreground">
                          +{a.ragIndexes.length - 2}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
              <li className="glass glow-edge rounded-xl p-4 text-xs text-muted-foreground flex flex-col items-start gap-2">
                <span className="font-mono text-2xs uppercase tracking-wider text-success">
                  after stage 07
                </span>
                <p>
                  Generated tests land in a PR. CI runs them on dev. Reviewer promotes to staging,
                  then prod. Failures loop back to triage.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/environments">
                    <PlayCircle className="h-3.5 w-3.5" />
                    Environments
                  </Link>
                </Button>
              </li>
            </ol>
          </section>
        </Reveal>

        {/* ───────── How to use it ───────── */}
        <Reveal delay={220}>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">How to use it</h2>
            <ol className="grid gap-3 md:grid-cols-3">
              <Step
                n={1}
                title="Pick a Jira ticket"
                body={
                  <>
                    Open <Mono>/tickets</Mono> or click <Mono>+ New run</Mono> from anywhere. Choose
                    the story you want covered.
                  </>
                }
                link={{ to: "/tickets", label: "Tickets" }}
              />
              <Step
                n={2}
                title="Watch the agents work"
                body={
                  <>
                    The orchestrator hands off between specialists. The run page shows the agent
                    canvas with live status, an inspector with model / tools / RAG hits, and the env
                    promotion lanes.
                  </>
                }
                link={{ to: "/runs", label: "Runs" }}
              />
              <Step
                n={3}
                title="Approve, reject, retry"
                body={
                  <>
                    Every stage pauses for your review. Approve to advance. Reject with a note to
                    iterate. Retry on errors. Failures get filed as Jira bugs and loop back through
                    triage.
                  </>
                }
                link={{ to: "/", label: "Dashboard" }}
              />
            </ol>
          </section>
        </Reveal>

        <footer className="glass rounded-xl p-4 text-xs text-muted-foreground flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            Topology and live stats built from a real FastAPI backend; synthetic values are marked
            with <MockedChip />
          </span>
          <span className="font-mono">v0.1 · autonomous QE</span>
        </footer>
      </div>
    </div>
  );
}

/* ───────── Helpers ───────── */

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => el.classList.add("in"), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className="reveal">
      {children}
    </div>
  );
}

function Drift({ count }: { count: number }) {
  return (
    <div className="drift fixed inset-0 z-0">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            bottom: `${(i * 11) % 70}%`,
            animationDuration: `${8 + (i % 7)}s`,
            animationDelay: `${(i * 0.5) % 7}s`,
          }}
        />
      ))}
    </div>
  );
}

function LiveStat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  mocked,
}: {
  icon: typeof Server;
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  tone: "success" | "info" | "warning" | "danger";
  mocked?: boolean;
}) {
  const ring =
    tone === "success"
      ? "ring-success/30"
      : tone === "info"
        ? "ring-info/30"
        : tone === "warning"
          ? "ring-warning/30"
          : "ring-destructive/30";
  const text =
    tone === "success"
      ? "text-success"
      : tone === "info"
        ? "text-info"
        : tone === "warning"
          ? "text-warning"
          : "text-destructive";
  return (
    <div className={cn("glass glow-edge rounded-xl p-3 ring-1 ring-inset", ring)}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-wider text-muted-foreground">
          <Icon className={cn("h-3 w-3", text)} />
          {label}
        </span>
        {mocked && <MockedChip />}
      </div>
      <p className={cn("mt-1 text-lg font-semibold tabular-nums", text)}>{value}</p>
      <p className="text-2xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  link,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
  link: { to: string; label: string };
}) {
  return (
    <div className="glass glow-edge rounded-xl p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xs text-primary">{String(n).padStart(2, "0")}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{body}</p>
      <Button asChild size="sm" variant="ghost" className="mt-3">
        <Link to={link.to}>
          {link.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-muted/40 px-1 py-px font-mono text-2xs text-foreground">
      {children}
    </span>
  );
}
