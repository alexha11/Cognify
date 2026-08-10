"use client";

import { cn } from "@/lib/utils";

/** A soft radial wash in the brand colour, at a given strength. */
function wash(strength: number) {
  return `radial-gradient(circle, color-mix(in srgb, var(--primary) ${strength}%, transparent) 0%, transparent 70%)`;
}

/**
 * Ambient background wash for marketing pages.
 *
 * This used to be five overlapping washes in peach, cyan, mint, amber and
 * lavender — five hues with no relationship to the brand or to each other.
 * It is now two brand-tinted glows: enough to keep the page from reading flat,
 * few enough that they stay background.
 */
export function AmbientLights() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Top spotlight, behind the hero. */}
      <div
        className="absolute -top-[220px] left-1/2 h-[520px] w-[1100px] -translate-x-1/2 blur-[110px] opacity-60 dark:opacity-40"
        style={{ background: wash(18) }}
      />

      {/* Low, off-centre glow so long pages don't fade to a flat field. */}
      <div
        className="animate-ambient-pulse-slow absolute top-[55%] -right-[10%] h-[700px] w-[700px] rounded-full blur-[140px] opacity-40 dark:opacity-30"
        style={{ background: wash(14) }}
      />
    </div>
  );
}

/**
 * Glowing Section Divider Line (Resend-style light line separator)
 * Place between major sections on the page.
 */
export function SectionLightDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full py-16 md:py-24 flex flex-col items-center justify-center pointer-events-none",
        className,
      )}
    >
      {/* Background base border line */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-border/70 dark:via-border/80 to-transparent" />

      {/* Glowing center highlight line */}
      <div className="absolute h-[1px] w-2/5 max-w-[600px] bg-gradient-to-r from-transparent via-primary/60 dark:via-white/90 to-transparent" />

      {/* Downward light flare / beam diffusion */}
      <div className="absolute top-[1px] h-[30px] w-1/3 max-w-[450px] bg-gradient-to-b from-primary/20 dark:from-white/20 via-primary/10 dark:via-white/5 to-transparent blur-md" />

      {/* Subtle radial ambient spot centered over line */}
      <div
        className="absolute w-[350px] h-[70px] opacity-40 dark:opacity-60 blur-xl rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 22%, transparent) 0%, color-mix(in srgb, var(--primary) 12%, transparent) 50%, transparent 70%)",
        }}
      />
    </div>
  );
}

/**
 * Card Light Flare for both Light & Dark Theme
 * Place at top of cards / feature containers for top border beam highlighting.
 */
export function CardLightFlare({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-20 overflow-hidden rounded-t-3xl",
        className,
      )}
    >
      {/* Top border beam line - visible in both light & dark mode */}
      <div className="mx-auto h-[1px] w-3/4 bg-gradient-to-r from-transparent via-primary/30 dark:via-white/60 to-transparent" />
      {/* Soft downward light diffusion */}
      <div className="mx-auto h-[35px] w-1/2 bg-gradient-to-b from-primary/10 dark:from-white/15 to-transparent blur-md" />
    </div>
  );
}
