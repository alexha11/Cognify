import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  label?: string;
  className?: string;
}

export function ProgressBar({
  percentage,
  label = "Progress",
  className,
}: ProgressBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-primary">{percentage}% Complete</span>
      </div>
    </div>
  );
}
