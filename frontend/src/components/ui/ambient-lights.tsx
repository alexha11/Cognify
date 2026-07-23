"use client";

import { cn } from "@/lib/utils";

/**
 * Resend & Linear inspired Ambient Background Lighting System
 * Dual-mode light/dark ambient spotlight beams, vibrant light-theme color washes, and card edge flares.
 */
export function AmbientLights() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* ── 1. Top Center Spotlight Beam ── */}
      {/* Light theme pastel aurora beam */}
      <div
        className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] opacity-75 dark:opacity-0 blur-[90px] transition-opacity duration-700"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 0%, rgba(254, 243, 199, 0.7) 0deg, rgba(216, 180, 254, 0.35) 60deg, rgba(186, 230, 253, 0.4) 120deg, transparent 180deg, rgba(199, 210, 254, 0.35) 240deg, rgba(254, 205, 211, 0.3) 300deg, rgba(254, 243, 199, 0.7) 360deg)",
        }}
      />
      {/* Dark theme spotlight beam */}
      <div
        className="absolute -top-[220px] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] opacity-0 dark:opacity-80 blur-[80px] transition-opacity duration-700"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 0%, rgba(255, 255, 255, 0.28) 0deg, rgba(139, 92, 246, 0.18) 60deg, transparent 120deg, transparent 240deg, rgba(59, 130, 246, 0.18) 300deg, rgba(255, 255, 255, 0.28) 360deg)",
        }}
      />

      {/* ── 2. Top-Right Soft Spotlight (Hero Visual) ── */}
      {/* Light theme: warm peach / violet halo */}
      <div
        className="absolute top-[-5%] right-[-5%] w-[650px] h-[650px] rounded-full opacity-60 dark:opacity-40 blur-[110px] animate-ambient-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(216, 180, 254, 0.4) 0%, rgba(251, 207, 232, 0.3) 40%, transparent 70%)",
        }}
      />

      {/* ── 3. Mid-Page Left Glow (Features Header) ── */}
      {/* Light theme: sky-cyan & indigo pastel glow */}
      <div
        className="absolute top-[32%] -left-[10%] w-[750px] h-[750px] rounded-full opacity-55 dark:opacity-35 blur-[140px] animate-ambient-pulse-slow"
        style={{
          background:
            "radial-gradient(circle, rgba(186, 230, 253, 0.45) 0%, rgba(199, 210, 254, 0.35) 45%, transparent 70%)",
        }}
      />

      {/* ── 4. Mid-Page Right Glow (Capabilities Grid) ── */}
      {/* Light theme: lavender & warm amber glow */}
      <div
        className="absolute top-[62%] -right-[10%] w-[800px] h-[800px] rounded-full opacity-55 dark:opacity-35 blur-[140px] animate-ambient-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(233, 213, 255, 0.45) 0%, rgba(254, 243, 199, 0.35) 45%, transparent 70%)",
        }}
      />

      {/* ── 5. Bottom Page Ambient Finish ── */}
      {/* Light theme: soft mint & sky blue */}
      <div
        className="absolute bottom-[3%] left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full opacity-50 dark:opacity-30 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(199, 210, 254, 0.4) 0%, rgba(186, 230, 253, 0.3) 50%, transparent 70%)",
        }}
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
      <div className="absolute top-[1px] h-[30px] w-1/3 max-w-[450px] bg-gradient-to-b from-indigo-500/20 dark:from-white/20 via-purple-500/10 dark:via-white/5 to-transparent blur-md" />

      {/* Subtle radial ambient spot centered over line */}
      <div
        className="absolute w-[350px] h-[70px] opacity-40 dark:opacity-60 blur-xl rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(147, 51, 234, 0.22) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)",
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
