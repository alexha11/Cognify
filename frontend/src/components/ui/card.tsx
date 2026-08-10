import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Cards sit one step above the page background. The separation comes from the
 * surface colour plus a real border — not from a heavy shadow — so the same
 * card reads correctly in both themes.
 *
 * `interactive` is opt-in: hover feedback should only appear on cards that are
 * actually clickable, otherwise every panel looks like a button.
 */
const cardVariants = cva(
  "rounded-xl border text-foreground transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "border-border bg-surface shadow-card",
        /** For nested cards — sits below its container rather than above. */
        sunken: "border-border bg-surface-sunken",
        /** Modals, popovers, anything floating over the page. */
        raised: "border-border bg-surface-raised shadow-raised",
        /** Empty states and drop targets. */
        dashed: "border-dashed border-border-strong bg-transparent",
      },
      interactive: {
        true: "hover:border-border-strong hover:bg-surface-hover cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
>(({ className, variant, interactive, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant, interactive, className }))}
    {...props}
  />
));
Card.displayName = "Card";

/* Padding steps up at sm: so cards aren't cramped on desktop or wasteful on
   mobile. Header/content/footer share the same inline padding so their edges
   align vertically. */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-foreground",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3 p-5 pt-0 sm:p-6 sm:pt-0",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
