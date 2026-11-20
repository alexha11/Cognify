"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

interface PageLoaderProps {
  /** Fill the viewport, for pages rendered without the dashboard shell. */
  fullScreen?: boolean;
  /** Visible text under the spinner; otherwise the label is for screen readers only. */
  message?: string;
  className?: string;
}

/**
 * The loading state of a whole page.
 *
 * It has to be its own component. When pages returned a bare <div> spinner,
 * React reused that same <div> as the page's content container once data
 * arrived, so the browser saw one element jump from the middle of the screen
 * to its final position: a layout shift (CLS) of 0.13 to 0.45 on every load.
 * A different element type is unmounted and replaced instead of moved.
 */
export function PageLoader({ fullScreen, message, className }: PageLoaderProps) {
  const { t } = useLanguage();

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen ? "min-h-screen bg-background" : "min-h-[60vh]",
        className,
      )}
    >
      <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : (
        <span className="sr-only">{t.common.loading}</span>
      )}
    </div>
  );
}
