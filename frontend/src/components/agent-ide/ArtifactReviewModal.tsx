import { Check, FileText, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ArtifactViewer } from "@/components/ArtifactViewer";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_BY_STAGE, isAutoStage } from "@/lib/agents";
import { STAGE_LABELS } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: Stage;
  pending: boolean;
  onApprove: (note?: string) => Promise<void> | void;
  onReject: (note: string) => Promise<void> | void;
  onRetry: () => Promise<void> | void;
}

export function ArtifactReviewModal({
  open,
  onOpenChange,
  stage,
  pending,
  onApprove,
  onReject,
  onRetry,
}: Props) {
  const def = AGENT_BY_STAGE[stage.name];
  const Glyph = def?.glyph ?? FileText;
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");

  const isAuto = isAutoStage(stage.name);
  const canApprove = stage.status === "awaiting_approval" && !isAuto;
  const canRetry = stage.status === "error" || stage.status === "rejected";

  // Reset the inline reject form whenever the modal opens for a new stage.
  useEffect(() => {
    if (open) {
      setShowReject(false);
      setNote("");
    }
  }, [open, stage.name]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden gap-0 max-h-[92vh] flex flex-col">
        {/* Header */}
        <header className="flex items-start gap-3 border-b border-border bg-surface-1/60 px-5 py-3 shrink-0">
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-md border border-primary/40",
              "bg-gradient-to-br from-primary/20 to-info/20",
              "shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)]",
            )}
          >
            <Glyph className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight">
              Review artifact · {STAGE_LABELS[stage.name]}
            </DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {def
                ? def.role
                : "Read the artifact below, then approve to continue or reject with feedback."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusPill status={stage.status} />
            <span className="font-mono text-2xs text-muted-foreground">
              {def?.short}
            </span>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-background/60 p-4 space-y-3">
          <ArtifactViewer stage={stage} />
          {stage.reviewer_note && (
            <div className="rounded-md border border-border bg-surface-1/40 p-3 text-xs">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prior reviewer note
              </p>
              <p className="mt-1 text-foreground whitespace-pre-wrap">
                {stage.reviewer_note}
              </p>
            </div>
          )}
        </div>

        {/* Footer — sticky action bar */}
        <footer className="border-t border-border bg-surface-1/80 backdrop-blur px-5 py-3 shrink-0">
          {showReject ? (
            <div className="space-y-2">
              <label className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                Feedback for the agent (required)
              </label>
              <Textarea
                autoFocus
                placeholder="What's wrong with this artifact? The agent will use this when iterating."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <div className="flex items-center justify-end gap-2">
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
                  onClick={async () => {
                    await onReject(note);
                    setNote("");
                    setShowReject(false);
                  }}
                  disabled={pending || !note.trim()}
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Reject stage
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {canApprove
                  ? "Approve to advance the pipeline to the next agent."
                  : canRetry
                    ? stage.status === "error"
                      ? "Re-run this agent to try again."
                      : "Re-run this agent after the reviewer feedback."
                    : "Read-only artifact — this stage has already been resolved."}
              </p>
              <div className="flex items-center gap-2">
                <DialogClose asChild>
                  <Button variant="ghost" size="sm">
                    Close
                  </Button>
                </DialogClose>
                {canApprove && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReject(true)}
                      disabled={pending}
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await onApprove();
                        onOpenChange(false);
                      }}
                      disabled={pending}
                    >
                      {pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Approve & continue
                    </Button>
                  </>
                )}
                {canRetry && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await onRetry();
                      onOpenChange(false);
                    }}
                    disabled={pending}
                  >
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Retry agent
                  </Button>
                )}
              </div>
            </div>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}
