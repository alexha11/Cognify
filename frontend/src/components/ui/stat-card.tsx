import * as React from "react";
import { cardVariants } from "./card";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  badge?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * Renders as a real <button> when it has an onClick, so clickable stats are
 * keyboard-reachable and announce their pressed state instead of being a div
 * that only responds to a mouse.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  badge,
  onClick,
  active,
  className,
  description,
  children,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            active
              ? "bg-primary text-primary-foreground"
              : "bg-primary-subtle text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {badge
          ? <Badge variant="outline">{badge}</Badge>
          : active
          ? <Badge variant="default">Active</Badge>
          : null}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </>
  );

  const classes = cn(
    cardVariants({ interactive: onClick ? true : undefined }),
    "space-y-4 p-5",
    active && "border-primary bg-primary-subtle",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={!!active}
        className={cn(classes, "w-full text-left")}
      >
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
