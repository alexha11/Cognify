import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm",
  {
    variants: {
      variant: {
        info: "border-info-border bg-info-subtle text-info",
        success: "border-success-border bg-success-subtle text-success",
        warning: "border-warning-border bg-warning-subtle text-warning",
        error: "border-error-border bg-error-subtle text-error",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
} as const;

/**
 * Replaces the inline light/dark palette blocks that were copied across forms.
 * The icon means the state is not communicated by colour alone.
 */
export function Alert({
  className,
  variant = "info",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  const Icon = icons[variant ?? "info"];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-foreground">{children}</div>
    </div>
  );
}
