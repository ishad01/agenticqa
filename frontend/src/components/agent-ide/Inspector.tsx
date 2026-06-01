import { Check, Database, Eye, FileText, Loader2, RefreshCw, Sparkles, Wrench, X } from "lucide-react";
import { useMemo, useState } from "react";

import { MockedChip } from "@/components/MockedChip";
import { StatusPill } from "@/components/StatusPill";
import { ArtifactReviewModal } from "@/components/agent-ide/ArtifactReviewModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_BY_STAGE, isAutoStage, type AgentDefinition, type RagHit } from "@/lib/agents";
import { ragHits } from "@/lib/mock";
import { STAGE_LABELS } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type { Run, Stage, StageName } from "@/lib/types";

interface Props {
  run: Run;
  stage: Stage;
  onSelectStage?: (s: StageName) => void;
  onApprove: (note?: string) => void;
  onReject: (note: string) => void;
  onRetry: () => void;
  pending: boolean;
}

type Tab = "overview" | "rag" | "tools" | "prompt" | "artifact";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "rag", label: "RAG" },
  { id: "tools", label: "Tools" },
  { id: "prompt", label: "Prompt" },
  { id: "artifact", label: "Artifact" },
];

export function Inspector({ run, stage, onApprove, onReject, onRetry, pending }: Props) {
  const def = AGENT_BY_STAGE[stage.name];
  const [tab, setTab] = useState<Tab>("overview");
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const hasArtifact = !!stage.artifact || stage.status === "error";
  const isAwaiting = stage.status === "awaiting_approval";
  const isAuto = isAutoStage(stage.name);

  const hits = useMemo(
    () => (def.ragIndexes.length ? ragHits(run.id + stage.name, def.ragIndexes, 7) : []),
    [run.id, stage.name, def.ragIndexes],
  );

  const canApprove = stage.status === "awaiting_approval";
  const canRetry = stage.status === "error" || stage.status === "rejected";

  const Glyph = def.glyph;

  return (
    <aside className="flex flex-col rounded-lg border bg-card overflow-hidden">
      <header className="border-b border-border bg-surface-1/60 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <div
            className={cn(
              "grid h-9 w-9 place-items-center rounded-md border bg-gradient-to-br from-primary/30 to-info/30",
              "shadow-[0_0_18px_-6px_hsl(var(--primary)/0.6)]",
            )}
          >
            <Glyph className="h-4 w-4 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold truncate">{def.name}</h2>
              <span className="rounded bg-muted/40 px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                {def.short}
              </span>
            </div>
            <p className="mt-0.5 text-2xs text-muted-foreground">{def.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusPill status={stage.status} />
          <span className="font-mono text-2xs text-muted-foreground">
            stage · {STAGE_LABELS[stage.name]}
          </span>
        </div>

        {isAuto && (
          <span className="inline-flex items-center gap-1 self-start rounded-full border border-info/40 bg-info/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-info">
            <Sparkles className="h-2.5 w-2.5" />
            auto · no review needed
          </span>
        )}
        {hasArtifact && (
          <Button
            type="button"
            size="sm"
            variant={isAwaiting ? "default" : "outline"}
            className={cn(
              "w-full justify-center gap-1.5",
              isAwaiting && "shadow-[0_0_18px_-4px_hsl(var(--warning)/0.7)]",
            )}
            onClick={() => setModalOpen(true)}
          >
            <Eye className="h-3.5 w-3.5" />
            {isAwaiting ? "Review artifact & decide" : "View artifact"}
          </Button>
        )}
      </header>

      <ArtifactReviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        stage={stage}
        pending={pending}
        onApprove={async (n) => onApprove(n)}
        onReject={async (n) => onReject(n)}
        onRetry={async () => onRetry()}
      />

      <nav className="flex items-center gap-0.5 border-b border-border bg-surface-1/40 px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-2.5 py-2 text-xs transition-colors -mb-px",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {tab === "overview" && <Overview def={def} stage={stage} hits={hits.length} />}
        {tab === "rag" && <RagTab hits={hits} def={def} />}
        {tab === "tools" && <ToolsTab def={def} />}
        {tab === "prompt" && <PromptTab def={def} />}
        {tab === "artifact" && <ArtifactTab stage={stage} />}
      </div>

      {(canApprove || canRetry) && !isAuto && (
        <footer className="border-t border-border bg-surface-1/60 p-3 space-y-2">
          {!showReject ? (
            <div className="flex items-center gap-2">
              {canApprove && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowReject(true)}
                    disabled={pending}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onApprove()}
                    disabled={pending}
                  >
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </Button>
                </>
              )}
              {canRetry && (
                <Button size="sm" className="flex-1" onClick={onRetry} disabled={pending}>
                  {pending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {pending ? "Re-running…" : "Retry agent"}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                autoFocus
                placeholder="Feedback for the agent to iterate on…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="text-xs"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReject(false);
                    setNote("");
                  }}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onReject(note);
                    setNote("");
                    setShowReject(false);
                  }}
                  disabled={pending || !note.trim()}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </footer>
      )}
    </aside>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/60 last:border-0">
      <span className="text-2xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground/90">{value}</span>
    </div>
  );
}

function Overview({
  def,
  stage,
  hits,
}: {
  def: AgentDefinition;
  stage: Stage;
  hits: number;
}) {

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-surface-1/40 p-2.5">
        <p className="text-2xs uppercase tracking-wider text-muted-foreground mb-1">Model</p>
        <p className="font-mono text-foreground">{def.model}</p>
      </div>
      <div className="rounded-md border border-border bg-surface-1/40 p-2.5 space-y-0">
        <Field label="Temperature" value={def.temperature} />
        <Field label="Max tokens" value={def.maxTokens.toLocaleString()} />
        <Field label="Tools" value={`${def.tools.length}`} />
        <Field
          label="RAG hits"
          value={
            <>
              {hits} <MockedChip className="ml-1" />
            </>
          }
        />
        <Field label="Started" value={stage.started_at ? new Date(stage.started_at).toLocaleTimeString() : "—"} />
        <Field
          label="Finished"
          value={stage.completed_at ? new Date(stage.completed_at).toLocaleTimeString() : "—"}
        />
      </div>
      <div>
        <p className="text-2xs uppercase tracking-wider text-muted-foreground mb-1.5">Capabilities</p>
        <div className="flex flex-wrap gap-1">
          {def.capabilities.map((c: string) => (
            <span
              key={c}
              className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      {stage.reviewer_note && (
        <div>
          <p className="text-2xs uppercase tracking-wider text-muted-foreground mb-1">
            Reviewer note
          </p>
          <p className="rounded-md border border-border bg-surface-1/40 p-2 text-foreground">
            {stage.reviewer_note}
          </p>
        </div>
      )}
    </div>
  );
}

function RagTab({
  hits,
  def,
}: {
  hits: RagHit[];
  def: AgentDefinition;
}) {
  if (def.ragIndexes.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-surface-1/30 p-3 text-center">
        <Database className="mx-auto h-4 w-4 text-muted-foreground" />
        <p className="mt-1 text-muted-foreground">This agent does not query the vector store.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-2xs uppercase tracking-wider text-muted-foreground">
          Indexes queried
        </p>
        <MockedChip />
      </div>
      <div className="flex flex-wrap gap-1">
        {def.ragIndexes.map((i: string) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2 py-0.5 font-mono text-[10px] text-info"
          >
            <Database className="h-2.5 w-2.5" />
            {i}
          </span>
        ))}
      </div>

      <p className="text-2xs uppercase tracking-wider text-muted-foreground pt-2">
        Top {hits.length} hits · cosine similarity
      </p>
      <ul className="space-y-1.5">
        {hits.map((h, i) => (
          <li
            key={i}
            className="rounded-md border border-border bg-surface-1/40 p-2 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-info truncate">{h.doc}</span>
              <span className="font-mono text-[10px] text-foreground">{h.score.toFixed(2)}</span>
            </div>
            <div className="relative h-1 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-info to-primary"
                style={{ width: `${h.score * 100}%` }}
              />
            </div>
            <p className="font-mono text-[10px] text-muted-foreground truncate">{h.snippet}</p>
            <span className="font-mono text-[10px] text-muted-foreground">idx · {h.index}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToolsTab({
  def,
}: {
  def: AgentDefinition;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-2xs uppercase tracking-wider text-muted-foreground">
          Tool inventory ({def.tools.length})
        </p>
        <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <ul className="space-y-1.5">
        {def.tools.map((t: { name: string; description: string; icon: React.ElementType }) => {
          const I = t.icon;
          return (
            <li
              key={t.name}
              className="flex items-start gap-2 rounded-md border border-border bg-surface-1/40 p-2"
            >
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-muted/40">
                <I className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-foreground">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{t.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PromptTab({
  def,
}: {
  def: AgentDefinition;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-2xs uppercase tracking-wider text-muted-foreground">System prompt</p>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
          <Sparkles className="h-2.5 w-2.5 text-primary" />
          {def.model}
        </span>
      </div>
      <pre className="rounded-md border border-border bg-surface-1/40 p-3 text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">
        {def.systemPrompt}
      </pre>
    </div>
  );
}

function ArtifactTab({ stage }: { stage: Stage }) {
  if (stage.error) {
    return (
      <pre className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-destructive max-h-96 overflow-auto">
        {stage.error}
      </pre>
    );
  }
  if (!stage.artifact) {
    return (
      <div className="rounded-md border border-dashed border-border bg-surface-1/30 p-3 text-center">
        <FileText className="mx-auto h-4 w-4 text-muted-foreground" />
        <p className="mt-1 text-muted-foreground">
          No artifact yet — the agent hasn't generated one.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-2xs uppercase tracking-wider text-muted-foreground">
        Generated artifact ({Object.keys(stage.artifact).length} fields)
      </p>
      <pre className="rounded-md border border-border bg-surface-1/40 p-2.5 text-[10px] leading-relaxed whitespace-pre-wrap font-mono text-foreground/90 max-h-96 overflow-auto">
        {JSON.stringify(stage.artifact, null, 2)}
      </pre>
    </div>
  );
}
