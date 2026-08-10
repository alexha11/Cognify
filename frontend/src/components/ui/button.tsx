import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Every variant shares the same geometry (height, padding, radius, weight) and
 * differs only in colour, so a row of mixed variants lines up exactly. Each one
 * defines hover / active / disabled explicitly rather than leaning on opacity,
 * which is what previously made disabled buttons look like hovered ones.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "font-medium transition-colors duration-150 cursor-pointer select-none",
    // Icons never stretch, and always match the label's optical size.
    "[&_svg]:shrink-0 [&_svg]:size-4",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover active:bg-primary-active disabled:bg-secondary disabled:text-subtle-foreground disabled:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-border disabled:text-subtle-foreground",
        outline:
          "border border-border-strong bg-surface text-foreground hover:bg-surface-hover hover:border-subtle-foreground active:bg-secondary disabled:bg-transparent disabled:text-subtle-foreground disabled:border-border",
        ghost:
          "text-foreground hover:bg-surface-hover active:bg-secondary disabled:text-subtle-foreground disabled:bg-transparent",
        destructive:
          "bg-error text-error-foreground shadow-xs hover:brightness-110 active:brightness-95 disabled:bg-secondary disabled:text-subtle-foreground disabled:shadow-none",
        link: "text-primary underline-offset-4 hover:underline disabled:text-subtle-foreground disabled:no-underline",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        xl: "h-13 px-8 text-base font-semibold",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-9 w-9 p-0",
      },
      /** Pills are a shape, not a colour — any variant can be one. */
      pill: {
        true: "rounded-full",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Swaps the leading icon for a spinner and blocks interaction. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      pill,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    // asChild forwards to a single child element, so a spinner cannot be
    // injected alongside it without breaking Slot's single-child contract.
    const showSpinner = loading && !asChild;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, pill, fullWidth, className }),
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {showSpinner
          ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {children}
            </>
          )
          : children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
