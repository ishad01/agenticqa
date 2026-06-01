import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const TONE: Record<NonNullable<Props["tone"]>, { value: string; icon: string; bar: string }> = {
  default: { value: "text-foreground", icon: "text-muted-foreground", bar: "bg-border" },
  success: { value: "text-success", icon: "text-success", bar: "bg-success/70" },
  warning: { value: "text-warning", icon: "text-warning", bar: "bg-warning/70" },
  danger: { value: "text-destructive", icon: "text-destructive", bar: "bg-destructive/70" },
  info: { value: "text-info", icon: "text-info", bar: "bg-info/70" },
};

export function KpiCard({ label, value, hint, icon: Icon, tone = "default", className }: Props) {
  const t = TONE[tone];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-px", t.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn("text-3xl font-semibold tabular-nums", t.value)}>{value}</p>
        </div>
        {Icon && <Icon className={cn("h-5 w-5", t.icon)} />}
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
