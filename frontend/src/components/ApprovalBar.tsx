import { Check, Loader2, RefreshCw, ShieldQuestion, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { STAGE_LABELS } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/types";

interface Props {
  stage: Stage;
  onApprove: (note?: string) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  onRetry: () => Promise<void>;
  pending: boolean;
}

export function ApprovalBar({ stage, onApprove, onReject, onRetry, pending }: Props) {
  const [note, setNote] = useState("");
  const [showReject, setShowReject] = useState(false);

  const canApprove = stage.status === "awaiting_approval";
  const canRetry = stage.status === "error" || stage.status === "rejected";

  if (!canApprove && !canRetry) return null;

  return (
    <div
      className={cn(
        "sticky bottom-4 z-10 rounded-lg border bg-card/95 backdrop-blur shadow-lg",
        canApprove ? "border-warning/40" : "border-destructive/40",
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md border",
              canApprove
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-destructive/40 bg-destructive/10 text-destructive",
            )}
          >
            {canApprove ? (
              <ShieldQuestion className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {canApprove
                ? `Review required · ${STAGE_LABELS[stage.name]}`
                : stage.status === "error"
                  ? `${STAGE_LABELS[stage.name]} hit an error`
                  : `${STAGE_LABELS[stage.name]} was rejected`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {canApprove
                ? "Approve to run the next stage, or reject with feedback to iterate."
                : "Re-run the agent on this stage to try again."}
            </p>
          </div>
        </div>

        {!showReject && (
          <div className="flex shrink-0 items-center gap-2">
            {canApprove && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReject(true)}
                  disabled={pending}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button size="sm" onClick={() => onApprove()} disabled={pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {pending ? "Working…" : "Approve & continue"}
                </Button>
              </>
            )}
            {canRetry && (
              <Button size="sm" onClick={onRetry} disabled={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {pending ? "Re-running…" : "Retry stage"}
              </Button>
            )}
          </div>
        )}
      </div>

      {showReject && (
        <div className="border-t border-border p-4 space-y-2">
          <label className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Feedback (required)
          </label>
          <Textarea
            autoFocus
            placeholder="What's wrong with this artifact? The agent will use this when iterating."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
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
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Reject stage
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
