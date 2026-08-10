import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared by Input, Textarea and any native <select> so form rows line up. */
export const fieldClassName = [
  "flex w-full rounded-md border border-border-strong bg-surface",
  "px-3 py-2 text-sm text-foreground transition-colors",
  "placeholder:text-subtle-foreground",
  "hover:border-border-strong",
  "focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-primary",
  "disabled:cursor-not-allowed disabled:bg-secondary disabled:text-subtle-foreground",
  // Paired with aria-invalid on the control, so the error state is exposed to
  // assistive tech rather than being colour-only.
  "aria-[invalid=true]:border-error aria-[invalid=true]:focus:outline-error",
].join(" ");

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(fieldClassName, "h-10", className)}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(fieldClassName, "min-h-20 resize-y py-2.5", className)}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
