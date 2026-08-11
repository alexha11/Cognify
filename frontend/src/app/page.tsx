"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  BarChart3,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Layers,
  Trophy,
  Sliders,
} from "lucide-react";
import { Header } from "@/components/layout";
import { RubiksCube } from "@/components/ui/rubiks-cube";
import {
  AmbientLights,
  SectionLightDivider,
} from "@/components/ui/ambient-lights";
import {
  AiGenerationPreview,
  AnalyticsPreview,
  ProcessingPreview,
  QuizPreview,
} from "@/components/ui/feature-previews";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useLanguage();
  const h = t.home;
  const [activeTab, setActiveTab] = useState<string>("all");

  const featureTabs = [
    { id: "all", label: h.tabAll },
    { id: "ai", label: h.tabAi },
    { id: "engine", label: h.tabEngine },
    { id: "docs", label: h.tabDocs },
    { id: "quiz", label: h.tabQuiz },
  ];

  const features = [
    {
      id: "ai",
      icon: Sparkles,
      file: "ai-question-generator.ts",
      badge: {
        text: "AI Engine Ready",
        cls: "text-muted-foreground bg-surface border-border",
      },
      Preview: AiGenerationPreview,
      title: h.aiTitle,
      description: h.aiDesc,
      linkLabel: h.aiLink,
    },
    {
      id: "engine",
      icon: BarChart3,
      file: "analytics-dashboard.tsx",
      badge: {
        text: "Live Analytics",
        cls: "text-muted-foreground bg-surface border-border",
      },
      Preview: AnalyticsPreview,
      title: h.engineTitle,
      description: h.engineDesc,
      linkLabel: h.engineLink,
    },
    {
      id: "docs",
      icon: BookOpen,
      file: "document-parser.py",
      badge: {
        text: "Vector RAG Embedded",
        cls: "text-muted-foreground bg-surface border-border",
      },
      Preview: ProcessingPreview,
      title: h.docsTitle,
      description: h.docsDesc,
      linkLabel: h.docsLink,
    },
    {
      id: "quiz",
      icon: Brain,
      file: "quiz-session.tsx",
      badge: {
        text: "Instant Feedback",
        cls: "text-muted-foreground bg-surface border-border",
      },
      Preview: QuizPreview,
      title: h.quizTitle,
      description: h.quizDesc,
      linkLabel: h.quizLink,
    },
  ];

  const capabilities = [
    {
      icon: Zap,
      title: h.cap1Title,
      description: h.cap1Desc,
    },
    {
      icon: BarChart3,
      title: h.cap2Title,
      description: h.cap2Desc,
    },
    {
      icon: Layers,
      title: h.cap3Title,
      description: h.cap3Desc,
    },
    {
      icon: Trophy,
      title: h.cap4Title,
      description: h.cap4Desc,
    },
    {
      icon: Sliders,
      title: h.cap5Title,
      description: h.cap5Desc,
    },
    {
      icon: ShieldCheck,
      title: h.cap6Title,
      description: h.cap6Desc,
    },
  ];

  const visibleFeatures = features.filter(
    (f) => activeTab === "all" || f.id === activeTab,
  );

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 relative overflow-hidden">
      {/* Ambient glow layer */}
      <AmbientLights />

      {/* Dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <Header />

      <main className="flex-1 pt-20 pb-36 relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* ── Hero ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center">
            <div className="space-y-6 text-center md:text-left">
              {/* Main Hero Title */}
              <h1 className="animate-fade-up text-5xl md:text-7xl lg:text-[5.25rem] font-semibold tracking-tight leading-[1.04] text-foreground">
                {h.heroTitle}{" "}
                <span className="text-muted-foreground/60 dark:text-muted-foreground/50">
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
              <div className="animate-fade-up delay-2 flex items-center justify-start gap-3 pt-2">
                <Link href="/courses">
                  <div className="group relative inline-flex overflow-hidden rounded-xl p-[2px] hover:scale-105 transition-transform duration-300">
                    {/* Animated glow border */}
                    <div
                      className="absolute inset-[-50%] -z-10 h-[200%] w-[200%] animate-rotate-glow bg-gradient-to-r from-primary via-primary-hover to-primary blur-lg"
                      style={{
                        backgroundSize: "50% 25%",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }}
                    />
                    <button className="relative cursor-pointer overflow-hidden rounded-md bg-card px-8 py-4 text-base font-bold text-foreground shadow-sm transition-all duration-300">
                      <span className="relative z-20 flex items-center gap-2">
                        {h.getStarted}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                      <span className="absolute left-[-75%] top-0 z-10 h-full w-[50%] rotate-12 bg-foreground/10 blur-lg transition-all duration-1000 ease-in-out group-hover:left-[125%]" />
                      <span className="absolute left-0 top-0 block h-[20%] w-1/2 rounded-tl-[10px] border-l-2 border-t-2 border-foreground transition-all duration-300" />
                      <span className="absolute right-0 top-0 block h-[60%] w-1/2 rounded-tr-[10px] border-r-2 border-t-2 border-foreground transition-all duration-300 group-hover:h-[90%]" />
                      <span className="absolute bottom-0 left-0 block h-[60%] w-1/2 rounded-bl-[10px] border-b-2 border-l-2 border-foreground transition-all duration-300 group-hover:h-[90%]" />
                      <span className="absolute bottom-0 right-0 block h-[20%] w-1/2 rounded-br-[10px] border-b-2 border-r-2 border-foreground transition-all duration-300" />
                    </button>
                  </div>
                </Link>
              </div>
            </div>

            <div className="animate-fade-up delay-3 relative w-full aspect-square md:aspect-video lg:aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/40 to-transparent rounded-full blur-3xl opacity-50 -z-10" />
              <RubiksCube />
            </div>
          </div>

          {/* Section Divider with Light Flare */}
          <SectionLightDivider className="my-32" />

          {/* ── Features ───────────────────────────────────────────────────── */}
          <div id="features" className="mt-12">
            {/* Section heading — left-aligned */}
            <Reveal className="max-w-2xl mb-10">
              <h2 className="text-4xl md:text-[3.25rem] font-semibold tracking-tight leading-[1.07] text-foreground">
                {h.featuresTitle}{" "}
                <span className="text-muted-foreground/55">{h.featuresHighlight}</span>
              </h2>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md">
                {h.featuresSubtitle}
              </p>
            </Reveal>

            {/* Filter tabs */}
            <div className="flex items-center gap-0 mb-10 border-b border-border/40 overflow-x-auto">
              {featureTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-foreground rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
              {visibleFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                const Preview = feature.Preview;
                return (
                  <Reveal
                    key={feature.id}
                    delay={idx * 70}
                    className="group relative rounded-lg border border-border/40 bg-card/10 overflow-hidden transition-colors duration-300 hover:border-border/70"
                  >
                    {/* Window frame */}
                    <div className="w-full h-[20rem] bg-surface border-b border-border flex flex-col">
                      {/* Title bar */}
                      <div className="h-9 px-4 flex items-center shrink-0 bg-surface-hover border-b border-border">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {/* Window dots, kept neutral — the traffic-light
                              colours pulled focus from the preview itself. */}
                          <div className="w-2.5 h-2.5 rounded-full bg-border-strong shrink-0" />
                          <div className="w-2.5 h-2.5 rounded-full bg-border-strong shrink-0" />
                          <div className="w-2.5 h-2.5 rounded-full bg-border-strong shrink-0" />
                          <span className="ml-3 text-xs font-mono text-muted-foreground truncate">
                            {feature.file}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-md border shrink-0 ml-2 ${feature.badge.cls}`}
                        >
                          {feature.badge.text}
                        </span>
                      </div>

                      {/* Product preview */}
                      <div className="relative flex-1 overflow-hidden">
                        <Preview />
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-6 lg:p-7">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-foreground/5 border border-border/40">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="space-y-2 min-w-0">
                          <h3 className="text-base font-semibold text-foreground tracking-tight">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                          <Link
                            href="/courses"
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors pt-1 group/link"
                          >
                            {feature.linkLabel}
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Section Divider with Light Flare */}
            <SectionLightDivider className="my-20 md:my-28" />

            {/* ── Capabilities grid ── */}
            <div className="pt-6 md:pt-10">
              <Reveal className="mb-16 max-w-lg">
                <h3 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.08]">
                  {h.everythingTitle}{" "}
                  <span className="text-muted-foreground/55">
                    {h.everythingHighlight}
                  </span>
                </h3>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  {h.everythingSubtitle}
                </p>
              </Reveal>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12">
                {capabilities.map((cap, idx) => {
                  const Icon = cap.icon;
                  return (
                    // Stagger across the row, not the whole list, so the third
                    // column doesn't wait on the first row to finish.
                    <Reveal
                      key={idx}
                      delay={(idx % 3) * 70}
                      className="space-y-3"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <h4 className="text-sm font-semibold text-foreground">
                        {cap.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {cap.description}
                      </p>
                    </Reveal>
                  );
                })}
              </div>
            </div>

            {/* Section Divider with Light Flare */}
            <SectionLightDivider className="my-20 md:my-28" />

            {/* ── CTA ── */}
            <Reveal className="text-center pt-6 md:pt-10">
              <h2 className="text-4xl md:text-[3.5rem] font-semibold tracking-tight text-foreground leading-[1.06]">
                {h.ctaTitle}
                <br />
                <span className="text-muted-foreground/55">
                  {h.ctaHighlight}
                </span>
              </h2>

              <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
                <Link href="/courses">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-85 transition-opacity">
                    {h.getStarted}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="inline-flex items-center gap-1.5 px-6 py-3 text-muted-foreground text-sm font-medium hover:text-foreground transition-colors cursor-pointer">
                    {h.contactUs}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/30 z-10 relative">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground/50">
            {t.common.copyright}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/courses" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">
              {h.footerCourses}
            </Link>
            <Link href="/contact" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">
              {h.footerContact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
