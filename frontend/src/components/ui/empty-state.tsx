import * as React from "react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn("border-dashed py-16 bg-card/50", className)}
    >
      <CardContent className="text-center space-y-6 pt-0">
        <Icon className="mx-auto h-12 w-12 text-muted-foreground/20" />
        <p className="text-muted-foreground font-serif text-lg italic">
          {message}
        </p>
        {action}
      </CardContent>
    </Card>
  );
}
