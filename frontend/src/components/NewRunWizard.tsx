import { ArrowLeft, ArrowRight, Loader2, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { JiraTicket } from "@/lib/types";

interface Props {
  tickets: JiraTicket[];
  onCreated?: () => void;
  trigger?: React.ReactNode;
}

export function NewRunWizard({ tickets, onCreated, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<JiraTicket | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) =>
      [t.key, t.title, ...t.labels, t.type, t.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, tickets]);

  const reset = () => {
    setStep(1);
    setSelected(null);
    setQuery("");
    setPending(false);
    setError(null);
  };

  const start = async () => {
    if (!selected) return;
    setPending(true);
    setError(null);
    try {
      const run = await api.createRun(selected.key);
      setOpen(false);
      reset();
      onCreated?.();
      navigate(`/runs/${run.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New run
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <DialogTitle className="text-base">Start a new agentic QE run</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Step {step} of 2 ·{" "}
                {step === 1 ? "Pick a Jira ticket to drive the pipeline" : "Confirm and kick off"}
              </p>
            </div>
            <Stepper step={step} />
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] min-h-[420px]">
            <div className="border-r border-border bg-surface-1/40">
              <div className="border-b border-border p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tickets…"
                    className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                  />
                </div>
              </div>
              <ul className="max-h-[360px] overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-muted-foreground">
                    No tickets match.
                  </li>
                ) : (
                  filtered.map((t) => (
                    <li key={t.key}>
                      <button
                        type="button"
                        onClick={() => setSelected(t)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm border-l-2 transition-colors",
                          selected?.key === t.key
                            ? "border-primary bg-primary/10"
                            : "border-transparent hover:bg-accent",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-2xs text-primary">{t.key}</span>
                          <span className="text-2xs text-muted-foreground">{t.type}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-foreground">{t.title}</p>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="p-5 overflow-y-auto max-h-[420px]">
              {selected ? (
                <TicketPreview ticket={selected} />
              ) : (
                <div className="grid h-full place-items-center text-center text-xs text-muted-foreground">
                  <div>
                    <Search className="mx-auto h-5 w-5 text-muted-foreground/60" />
                    <p className="mt-2">Select a ticket to preview it.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4 min-h-[360px]">
            {selected && <TicketPreview ticket={selected} />}
            <div className="rounded-md border border-border bg-surface-1/50 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">What happens next?</p>
              <ol className="mt-2 list-decimal pl-5 space-y-1">
                <li>The agent pulls this ticket and synthesizes context from the repo.</li>
                <li>You'll be brought to the run, where each stage pauses for your approval.</li>
                <li>Approve to continue, reject with feedback to iterate, retry on errors.</li>
              </ol>
            </div>
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-surface-1/40">
          <div className="text-xs text-muted-foreground">
            {selected ? (
              <>
                Picked: <span className="font-mono text-foreground">{selected.key}</span>
              </>
            ) : (
              "No ticket selected"
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                disabled={pending}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button
                size="sm"
                disabled={!selected}
                onClick={() => setStep(2)}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={start} disabled={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {pending ? "Starting…" : "Start run"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="hidden sm:flex items-center gap-1.5 text-2xs font-mono uppercase">
      <span
        className={cn(
          "rounded-full px-2 py-0.5",
          step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        1 · Pick
      </span>
      <span className="text-muted-foreground">›</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5",
          step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        2 · Confirm
      </span>
    </div>
  );
}

function TicketPreview({ ticket }: { ticket: JiraTicket }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-primary">{ticket.key}</span>
        <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-2xs">
          {ticket.type}
        </span>
        <span className="rounded border border-info/40 bg-info/10 px-1.5 py-0.5 text-2xs text-info">
          {ticket.status}
        </span>
      </div>
      <h3 className="text-base font-semibold leading-snug">{ticket.title}</h3>
      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
          Acceptance criteria ({ticket.acceptance_criteria.length})
        </p>
        <ol className="space-y-1.5 text-xs">
          {ticket.acceptance_criteria.map((ac, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-mono text-muted-foreground">{i + 1}.</span>
              <span className="text-foreground">{ac}</span>
            </li>
          ))}
        </ol>
      </div>
      {ticket.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {ticket.labels.map((l) => (
            <span
              key={l}
              className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-2xs text-muted-foreground"
            >
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
