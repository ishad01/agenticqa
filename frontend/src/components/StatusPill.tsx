import { StatusDot } from "@/components/StatusDot";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/stage";
import { cn } from "@/lib/utils";
import type { StageStatus } from "@/lib/types";

interface Props {
  status: StageStatus;
  className?: string;
  withDot?: boolean;
}

export function StatusPill({ status, className, withDot = true }: Props) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-medium uppercase tracking-wide",
        s.bg,
        s.border,
        s.text,
        className,
      )}
    >
      {withDot && <StatusDot status={status} />}
      {STATUS_LABELS[status]}
    </span>
  );
}
