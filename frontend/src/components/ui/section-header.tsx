import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  variant = "default",
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2
        className={cn(
          "text-2xl font-semibold tracking-tight",
          variant === "destructive" && "text-destructive",
        )}
      >
        {title}
      </h2>
      <div
        className={cn(
          "h-[1px] flex-1 mx-8",
          variant === "destructive" ? "bg-destructive/20" : "bg-border/40",
        )}
      />
      {action}
    </div>
  );
}
