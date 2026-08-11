"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stagger within a group, in ms. Keep under ~250 total or it reads as lag. */
  delay?: number;
  /** How far the element travels on the way in. */
  distance?: number;
  children: React.ReactNode;
}

/**
 * Reveals its children once, when they first scroll into view.
 *
 * Uses IntersectionObserver rather than a scroll listener so nothing runs on
 * the main thread between intersections, and disconnects after firing — these
 * are one-shot entrances, and re-animating on scroll-back is the thing that
 * makes marketing pages feel restless.
 *
 * Elements start visible and are only hidden once we know we can animate them:
 * if JS never runs, or IntersectionObserver is missing, the content must not
 * be stranded invisible.
 */
export function Reveal({
  delay = 0,
  distance = 16,
  className,
  children,
  style,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(false);
  const [armed, setArmed] = React.useState(false);

  // Layout effect so the element is hidden before the browser paints, which
  // avoids a flash of the final position on first render.
  React.useLayoutEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    setArmed(true);
  }, []);

  React.useEffect(() => {
    if (!armed) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // Fire slightly before the element reaches the viewport edge, so the
      // motion is finishing as it comes into full view rather than starting.
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [armed]);

  const hidden = armed && !shown;

  return (
    <div
      ref={ref}
      className={cn(
        "motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out",
        className,
      )}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translateY(${distance}px)` : "none",
        transitionDelay: hidden ? undefined : `${delay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
