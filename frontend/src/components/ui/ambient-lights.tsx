"use client";

import { cn } from "@/lib/utils";

/**
 * Resend-style Ambient Background Lighting System
 * Adds top spotlights, radial halos, and beam effects to eliminate monochrome/flat backgrounds.
 */
export function AmbientLights() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* ── 1. Top Center Resend-style Beam ── */}
      <div
        className="absolute -top-[220px] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] opacity-40 dark:opacity-75 blur-[80px]"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 0%, rgba(255, 255, 255, 0.25) 0deg, rgba(139, 92, 246, 0.15) 60deg, transparent 120deg, transparent 240deg, rgba(59, 130, 246, 0.15) 300deg, rgba(255, 255, 255, 0.25) 360deg)",
        }}
      />

      {/* ── 2. Top-Right Soft Spotlight (Hero Visual) ── */}
      <div
        className="absolute top-[-5%] right-[-5%] w-[650px] h-[650px] rounded-full opacity-25 dark:opacity-40 blur-[110px] animate-ambient-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(147, 51, 234, 0.18) 35%, transparent 70%)",
        }}
      />

      {/* ── 3. Mid-Page Left Glow (Feature 1 & 2) ── */}
      <div
        className="absolute top-[35%] -left-[10%] w-[750px] h-[750px] rounded-full opacity-20 dark:opacity-35 blur-[140px] animate-ambient-pulse-slow"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(59, 130, 246, 0.1) 45%, transparent 70%)",
        }}
      />

      {/* ── 4. Mid-Page Right Glow (Feature 3 & 4) ── */}
      <div
        className="absolute top-[65%] -right-[10%] w-[800px] h-[800px] rounded-full opacity-20 dark:opacity-35 blur-[140px] animate-ambient-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(236, 72, 153, 0.1) 45%, transparent 70%)",
        }}
      />

      {/* ── 5. Bottom Page Ambient Finish ── */}
      <div
        className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full opacity-15 dark:opacity-30 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)",
        }}
      />
    </div>
  );
}

/**
 * Resend-style Card Light Flare
 * Place at top of cards / feature containers for top border beam highlighting.
 */
export function CardLightFlare({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 top-0 z-20 overflow-hidden rounded-t-3xl", className)}>
      {/* Top border beam line */}
      <div className="mx-auto h-[1px] w-3/4 bg-gradient-to-r from-transparent via-white/40 dark:via-white/60 to-transparent" />
      {/* Soft downward light diffusion */}
      <div className="mx-auto h-[35px] w-1/2 bg-gradient-to-b from-white/10 dark:from-white/15 to-transparent blur-md" />
    </div>
  );
}
