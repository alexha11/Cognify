import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  label?: string;
  /** Tints the fill — use to signal pass/fail rather than raw progress. */
  tone?: "primary" | "success" | "warning" | "error";
  className?: string;
}

const toneFill = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
} as const;

export function ProgressBar({
  percentage,
  label = "Progress",
  tone = "primary",
  className,
}: ProgressBarProps) {
  const value = Math.max(0, Math.min(100, Math.round(percentage)));

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            toneFill[tone],
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground tabular-nums">
          {value}%
        </span>
      </div>
    </div>
  );
}
