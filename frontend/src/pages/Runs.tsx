import { Loader2, RefreshCw, Search, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { NewRunWizard } from "@/components/NewRunWizard";
import { Skeleton } from "@/components/Skeleton";
import { StatusDot } from "@/components/StatusDot";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { useRuns, useTickets } from "@/hooks/useApi";
import { absoluteTime, relativeTime, shortId } from "@/lib/format";
import { STAGE_LABELS, STATUS_LABELS } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type { StageStatus } from "@/lib/types";
import { PageHeader } from "@/pages/Dashboard";

const STATUS_FILTERS: { value: StageStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "awaiting_approval", label: "Awaiting review" },
  { value: "error", label: "Errored" },
  { value: "approved", label: "Approved" },
];

export function RunsPage() {
  const { data, error, loading, reload } = useRuns(5000);
  const { data: tickets } = useTickets();
  const [filter, setFilter] = useState<StageStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => (filter === "all" ? true : r.current_status === filter))
      .filter((r) =>
        q
          ? [r.jira_ticket, r.title, r.id].join(" ").toLowerCase().includes(q)
          : true,
      );
  }, [data, filter, query]);

  return (
    <div className="space-y-5 p-6 lg:p-8">
      <PageHeader
        title="Runs"
        subtitle="Every pipeline execution across the platform. Filter by status or search by ticket."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={reload}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            {tickets && <NewRunWizard tickets={tickets} onCreated={reload} />}
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ticket, title, or id…"
            className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === "all"
                ? data?.length ?? 0
                : (data ?? []).filter((r) => r.current_status === f.value).length;
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {f.label}
                <span className="rounded-full bg-background/60 px-1.5 py-px font-mono text-2xs">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-1/60 text-2xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2 w-8" />
                <th className="text-left font-medium px-3 py-2 w-28">Ticket</th>
                <th className="text-left font-medium px-3 py-2">Title</th>
                <th className="text-left font-medium px-3 py-2 w-44">Current stage</th>
                <th className="text-left font-medium px-3 py-2 w-36">Status</th>
                <th className="text-left font-medium px-3 py-2 w-28">Updated</th>
                <th className="text-left font-medium px-3 py-2 w-24">Run id</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && !data ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-3 py-3">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12">
                    <EmptyState
                      icon={Workflow}
                      title={query || filter !== "all" ? "No runs match" : "No runs yet"}
                      description={
                        query || filter !== "all"
                          ? "Try clearing your filters."
                          : "Spin up a run from a Jira ticket to see it here."
                      }
                      action={
                        tickets && filter === "all" && !query ? (
                          <NewRunWizard tickets={tickets} onCreated={reload} />
                        ) : null
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="group hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <StatusDot status={r.current_status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        to={`/runs/${r.id}`}
                        className="font-mono text-2xs text-primary hover:underline"
                      >
                        {r.jira_ticket}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 max-w-md">
                      <Link
                        to={`/runs/${r.id}`}
                        className="text-foreground hover:underline truncate inline-block max-w-full align-middle"
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {STAGE_LABELS[r.current_stage]}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={r.current_status} />
                    </td>
                    <td
                      className="px-3 py-2.5 text-xs text-muted-foreground"
                      title={absoluteTime(r.updated_at)}
                    >
                      {relativeTime(r.updated_at)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-2xs text-muted-foreground">
                      {shortId(r.id)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 bg-surface-1/40 text-2xs text-muted-foreground">
          <span>
            Showing <span className="font-mono text-foreground">{filtered.length}</span> of{" "}
            <span className="font-mono text-foreground">{data?.length ?? 0}</span> runs
          </span>
          <span className="inline-flex items-center gap-1.5">
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>
              Live <span className="font-mono">{STATUS_LABELS.running}</span> · auto-refresh 5s
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
