import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Status colours come from the token trio (`X` / `X-subtle` / `X-border`), so a
 * badge themes itself instead of needing a `dark:` counterpart per variant.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-primary-border bg-primary-subtle text-primary",
        secondary: "border-transparent bg-secondary text-muted-foreground",
        success: "border-success-border bg-success-subtle text-success",
        warning: "border-warning-border bg-warning-subtle text-warning",
        destructive: "border-error-border bg-error-subtle text-error",
        info: "border-info-border bg-info-subtle text-info",
        outline: "border-border-strong bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(badgeVariants({ variant, className }))}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge, badgeVariants };
