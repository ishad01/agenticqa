import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Loader2,
  Radar,
  Rocket,
  Search,
  TicketCheck,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { useBuilds, useTickets } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BuildState, BuildStatus, JiraTicket } from "@/lib/types";
import { PageHeader } from "@/pages/Dashboard";

export function TicketsPage() {
  const { data, error, loading } = useTickets();
  const { data: builds } = useBuilds(2000);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<JiraTicket | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  const buildByKey = useMemo(() => {
    const m = new Map<string, BuildStatus>();
    (builds ?? []).forEach((b) => m.set(b.ticket_key, b));
    return m;
  }, [builds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((t) =>
      q ? [t.key, t.title, ...t.labels].join(" ").toLowerCase().includes(q) : true,
    );
  }, [data, query]);

  const startRun = async () => {
    if (!selected) return;
    setStarting(true);
    try {
      const run = await api.createRun(selected.key);
      navigate(`/runs/${run.id}`);
    } finally {
      setStarting(false);
    }
  };

  const triggerBuildCheck = async (key: string) => {
    setChecking(key);
    try {
      await api.checkBuild(key);
    } finally {
      setChecking(null);
    }
  };

  return (
    <div className="space-y-5 p-6 lg:p-8">
      <PageHeader
        title="QE Workflow → Ready for Run"
        subtitle="Jira stories ready for QE. The Build-ready trigger watches the repository for a mergeable commit and auto-starts the agentic QE workflow."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-info/40 bg-info/10 px-2.5 py-1 text-2xs font-mono uppercase tracking-wider text-info">
            <Radar className="h-3 w-3" />
            build watcher · live
          </span>
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tickets…"
          className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-1/60 text-2xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-3 py-2 w-24">Key</th>
                  <th className="text-left font-medium px-3 py-2">Title</th>
                  <th className="text-left font-medium px-3 py-2 w-24">Type</th>
                  <th className="text-left font-medium px-3 py-2 w-56">Build status</th>
                  <th className="text-left font-medium px-3 py-2 w-44" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && !data ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-3 py-3">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10">
                      <EmptyState
                        icon={TicketCheck}
                        title="No tickets match"
                        description="Try a different search term."
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const active = selected?.key === t.key;
                    const build = buildByKey.get(t.key);
                    return (
                      <tr
                        key={t.key}
                        onClick={() => setSelected(t)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          active ? "bg-primary/10" : "hover:bg-accent/50",
                        )}
                      >
                        <td className="px-3 py-2.5 font-mono text-2xs text-primary align-top">
                          {t.key}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-foreground">{t.title}</div>
                          {t.labels.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {t.labels.map((l) => (
                                <span
                                  key={l}
                                  className="rounded border border-border bg-muted/40 px-1.5 py-px text-2xs text-muted-foreground"
                                >
                                  {l}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground align-top">
                          {t.type}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <BuildCell build={build} />
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <BuildAction
                            build={build}
                            ticketKey={t.key}
                            checking={checking === t.key}
                            onTrigger={(e) => {
                              e.stopPropagation();
                              triggerBuildCheck(t.key);
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border bg-surface-1/40 px-3 py-2 text-2xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Radar className="h-3 w-3 text-info" />
              Build watcher polls the repo for a mergeable commit; when found, the
              QE workflow auto-triggers and the ticket flips to{" "}
              <span className="text-info font-mono">in_progress</span>.
            </span>
            <span className="font-mono">refresh · 2s</span>
          </div>
        </div>

        <aside className="rounded-lg border bg-card overflow-hidden">
          {selected ? (
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                <div>
                  <p className="font-mono text-2xs text-primary">{selected.key}</p>
                  <h2 className="mt-1 text-base font-semibold leading-snug">
                    {selected.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Clear selection"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <section>
                  <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-wrap">
                    {selected.description}
                  </p>
                </section>
                <section>
                  <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Acceptance criteria
                  </p>
                  <ol className="mt-1.5 space-y-1.5 text-sm">
                    {selected.acceptance_criteria.map((ac, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-mono text-2xs text-muted-foreground">
                          {i + 1}.
                        </span>
                        <span>{ac}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
              <div className="border-t border-border p-3">
                <Button onClick={startRun} disabled={starting} className="w-full">
                  {starting ? "Starting…" : `Start run from ${selected.key}`}
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={TicketCheck}
              title="Select a ticket"
              description="Pick a ticket on the left to preview details, or trigger Build-ready to start the QE workflow automatically."
              className="m-3"
            />
          )}
        </aside>
      </div>
    </div>
  );
}

const STATE_META: Record<
  BuildState,
  { label: string; classes: string; icon: typeof Radar }
> = {
  idle: {
    label: "no build yet",
    classes: "border-border bg-muted/40 text-muted-foreground",
    icon: Radar,
  },
  checking: {
    label: "checking repo…",
    classes: "border-info/40 bg-info/10 text-info",
    icon: Loader2,
  },
  build_ready: {
    label: "build ready",
    classes: "border-success/40 bg-success/10 text-success",
    icon: GitBranch,
  },
  in_progress: {
    label: "QE in progress",
    classes: "border-primary/40 bg-primary/15 text-primary",
    icon: Rocket,
  },
  done: {
    label: "QE done",
    classes: "border-success/40 bg-success/10 text-success",
    icon: CheckCircle2,
  },
  failed: {
    label: "failed",
    classes: "border-destructive/40 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
};

function BuildCell({ build }: { build: BuildStatus | undefined }) {
  const state = build?.state ?? "idle";
  const meta = STATE_META[state];
  const Icon = meta.icon;
  return (
    <div className="space-y-1">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-mono uppercase tracking-wider",
          meta.classes,
        )}
      >
        <Icon className={cn("h-3 w-3", state === "checking" && "animate-spin")} />
        {meta.label}
      </span>
      {build?.commit && (
        <p className="font-mono text-2xs text-muted-foreground">
          <GitBranch className="inline h-2.5 w-2.5 mr-0.5" />
          {build.branch} · <span className="text-foreground">{build.commit}</span>
        </p>
      )}
      {build?.detected_at && (
        <p className="text-2xs text-muted-foreground">
          detected {relativeTime(build.detected_at)}
        </p>
      )}
      {build?.message && state !== "in_progress" && state !== "done" && (
        <p className="text-2xs text-muted-foreground line-clamp-2">{build.message}</p>
      )}
    </div>
  );
}

function BuildAction({
  build,
  ticketKey,
  checking,
  onTrigger,
}: {
  build: BuildStatus | undefined;
  ticketKey: string;
  checking: boolean;
  onTrigger: (e: React.MouseEvent) => void;
}) {
  const state = build?.state ?? "idle";

  if (state === "in_progress" || state === "done") {
    return (
      <Button
        asChild
        size="sm"
        variant="outline"
        className="w-full justify-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Link to={`/runs/${build?.run_id}`}>
          Open run
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    );
  }

  if (state === "checking" || state === "build_ready") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-2xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        auto-trigger…
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full justify-center gap-1 shadow-[0_0_18px_-6px_hsl(var(--info)/0.5)]"
      onClick={onTrigger}
      disabled={checking}
    >
      {checking ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Radar className="h-3.5 w-3.5" />
      )}
      Check repo for build · {ticketKey}
    </Button>
  );
}
