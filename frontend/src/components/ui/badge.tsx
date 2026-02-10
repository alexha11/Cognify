import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?:
      | "default"
      | "secondary"
      | "success"
      | "warning"
      | "destructive"
      | "outline";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary/10 text-primary",
    secondary: "bg-muted text-muted-foreground",
    success: "bg-green-500/5 text-green-700 border border-green-500/10",
    warning: "bg-yellow-500/5 text-yellow-700 border border-yellow-500/10",
    destructive:
      "bg-destructive/5 text-destructive border border-destructive/10",
    outline: "border border-border",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
