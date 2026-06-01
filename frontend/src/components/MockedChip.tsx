import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  label?: string;
}

/** Marks a value as synthesized (no backend source yet). */
export function MockedChip({ className, label = "synthetic" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary",
        className,
      )}
      title="This value is synthesized in the frontend. Backend wiring TODO."
    >
      <Sparkles className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
