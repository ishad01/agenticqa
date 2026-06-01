import { cn } from "@/lib/utils";
import { STATUS_STYLES, isInFlight } from "@/lib/stage";
import type { StageStatus } from "@/lib/types";

interface Props {
  status: StageStatus;
  size?: "sm" | "md";
  className?: string;
}

export function StatusDot({ status, size = "sm", className }: Props) {
  const s = STATUS_STYLES[status];
  const dim = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span className={cn("rounded-full", dim, s.dot)} />
      {isInFlight(status) && (
        <span className={cn("absolute inset-0 rounded-full animate-ping", s.dot, "opacity-50")} />
      )}
    </span>
  );
}
