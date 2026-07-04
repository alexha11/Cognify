import * as React from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  badge,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end justify-between gap-6",
        className,
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground font-serif text-base leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {badge && (
          <Badge
            variant="outline"
            className="px-4 py-1.5 h-fit text-[10px] font-bold uppercase tracking-widest bg-primary/5"
          >
            {badge}
          </Badge>
        )}
        {action}
      </div>
    </div>
  );
}
