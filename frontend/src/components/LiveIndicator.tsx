import { cn } from "@/lib/utils";

interface Props {
  active: boolean;
  label?: string;
  className?: string;
}

export function LiveIndicator({ active, label = "Live", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wide",
        active
          ? "border-success/40 bg-success/10 text-success"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-success live-dot" : "bg-muted-foreground/60",
        )}
      />
      {active ? label : "Idle"}
    </span>
  );
}
