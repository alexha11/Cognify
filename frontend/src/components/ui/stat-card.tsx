import * as React from "react";
import { Card, CardContent } from "./card";
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
  return (
    <Card
      className={cn(
        "transition-all duration-300",
        onClick && "cursor-pointer",
        active
          ? "border-primary/30 bg-secondary/30"
          : "hover:bg-secondary/20",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          {badge && (
            <Badge
              variant="outline"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              {badge}
            </Badge>
          )}
          {active && !badge && (
            <Badge
              variant="outline"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Active
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {label}
          </p>
          <p className="text-4xl font-semibold tracking-tighter text-foreground">
            {value}
          </p>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground font-serif italic">
            {description}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
