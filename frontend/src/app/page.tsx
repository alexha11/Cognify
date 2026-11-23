"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout";
import { HeroCube } from "@/components/ui/hero-cube";
import { AmbientLights } from "@/components/ui/ambient-lights";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureTiles } from "@/components/landing/feature-tiles";
import { TryIt } from "@/components/landing/try-it";
import { useLanguage } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useLanguage();
  const h = t.home;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 relative overflow-hidden">
      {/* Ambient glow layer */}
      <AmbientLights />

      {/* Dot-grid texture, behind the hero only */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1100px] opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <Header />

      <main className="flex-1 relative z-10">
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 lg:px-8 md:pb-32">
          {/* ── Hero ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center">
            <div className="space-y-6 text-center md:text-left">
              {/* Main Hero Title */}
              <h1 className="animate-fade-up text-5xl md:text-7xl lg:text-[5.25rem] font-semibold tracking-tight leading-[1.04] text-foreground">
                {h.heroTitle}{" "}
                <span className="text-subtle-foreground">
                  {h.heroHighlight}
                </span>
              </h1>

              {/* Subtitle with highlighted key phrases */}
              <p className="animate-fade-up delay-1 max-w-xl text-lg md:text-xl leading-relaxed text-muted-foreground/90 font-normal mx-auto md:mx-0">
                {h.heroSub1}{" "}
                <span className="text-foreground font-medium">
                  {h.heroSubHighlight1}
                </span>
                {h.heroSub2}{" "}
                <span className="text-foreground font-medium">
                  {h.heroSubHighlight2}
                </span>
                .
              </p>
              {/* Centred under the centred hero text on phones. The link is
                  the control itself: a <button> inside an <a> is two tab
                  stops and is announced as a button that navigates. */}
              <div className="animate-fade-up delay-2 flex items-center justify-center md:justify-start gap-3 pt-2">
                <Link
                  href="/courses"
                  className="group relative inline-flex overflow-hidden rounded-xl p-[2px] hover:scale-105 transition-transform duration-300"
                >
                  {/* Animated glow border */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-[-50%] -z-10 h-[200%] w-[200%] animate-rotate-glow bg-gradient-to-r from-primary via-primary-hover to-primary blur-lg"
                    style={{
                      backgroundSize: "50% 25%",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                    }}
                  />
                  <span className="relative overflow-hidden rounded-md bg-card px-8 py-4 text-base font-bold text-foreground shadow-sm transition-all duration-300">
                    <span className="relative z-20 flex items-center gap-2">
                      {h.getStarted}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <span className="absolute left-[-75%] top-0 z-10 h-full w-[50%] rotate-12 bg-foreground/10 blur-lg transition-all duration-1000 ease-in-out group-hover:left-[125%]" />
                    <span className="absolute left-0 top-0 block h-[20%] w-1/2 rounded-tl-[10px] border-l-2 border-t-2 border-foreground transition-all duration-300" />
                    <span className="absolute right-0 top-0 block h-[60%] w-1/2 rounded-tr-[10px] border-r-2 border-t-2 border-foreground transition-all duration-300 group-hover:h-[90%]" />
                    <span className="absolute bottom-0 left-0 block h-[60%] w-1/2 rounded-bl-[10px] border-b-2 border-l-2 border-foreground transition-all duration-300 group-hover:h-[90%]" />
                    <span className="absolute bottom-0 right-0 block h-[20%] w-1/2 rounded-br-[10px] border-b-2 border-r-2 border-foreground transition-all duration-300" />
                  </span>
                </Link>
              </div>
            </div>

            <div className="animate-fade-up delay-3 relative w-full aspect-square md:aspect-video lg:aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/40 to-transparent rounded-full blur-3xl opacity-50 -z-10" />
              <HeroCube />
            </div>
          </div>
        </div>

        {/* After the hero: one background, sections separated by a hairline. */}
        <div className="bg-background">
          <HowItWorks />
          <FeatureTiles />
          <TryIt />
        </div>
      </main>

      <footer className="border-t border-border z-10 relative bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 py-6 sm:flex-row">
          <p className="text-xs text-subtle-foreground">
            {t.common.copyright}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/courses" className="text-xs text-subtle-foreground hover:text-foreground transition-colors">
              {h.footerCourses}
            </Link>
            <Link href="/contact" className="text-xs text-subtle-foreground hover:text-foreground transition-colors">
              {h.footerContact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
