import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  className?: string;
}

/**
 * One level below PageHeader. The old decorative rule between title and action
 * is gone — spacing separates the two well enough without a line that broke
 * whenever the title wrapped.
 */
export function SectionHeader({
  title,
  description,
  variant = "default",
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h2
          className={cn(
            "text-lg font-semibold tracking-tight",
            variant === "destructive" ? "text-error" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
