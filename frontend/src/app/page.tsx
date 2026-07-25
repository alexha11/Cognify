"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

// ── Feature card data ──────────────────────────────────────────────────────────
const features = [
  {
    id: "ai",
    icon: Sparkles,
    file: "ai-question-generator.ts",
    badge: {
      text: "AI Engine Ready",
      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    image: "/images/features/ai_generation.png",
    alt: "AI Question Generation Interface",
    title: "AI-Powered Question Generation",
    description:
      "Instantly convert your course materials into high-quality assessments. Full control over question types, difficulty levels, and automatic grading with just a click.",
    linkLabel: "Explore generation",
  },
  {
    id: "engine",
    icon: BarChart3,
    file: "analytics-dashboard.tsx",
    badge: {
      text: "Live Analytics",
      cls: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    image: "/images/features/analytics.png",
    alt: "Modern Assessment Engine Analytics",
    title: "Modern Assessment Engine",
    description:
      "An intuitive engine that makes it easy for anyone to create and manage questions across all difficulty levels. Monitor student engagement with real-time analytics.",
    linkLabel: "View analytics",
  },
  {
    id: "docs",
    icon: BookOpen,
    file: "document-parser.py",
    badge: {
      text: "Vector RAG Embedded",
      cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    image: "/images/features/processing.png",
    alt: "Smart Document Processing",
    title: "Smart Document Processing",
    description:
      "Upload your course materials in any format. Our system automatically processes, chunks, and creates semantic embeddings to ensure the AI understands every detail.",
    linkLabel: "Upload materials",
  },
  {
    id: "quiz",
    icon: Brain,
    file: "quiz-session.tsx",
    badge: {
      text: "Instant Feedback",
      cls: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    image: "/images/features/quiz.png",
    alt: "Interactive Quiz Experience",
    title: "Interactive Quiz Experience",
    description:
      "Deliver a sleek, fast quiz interface for your students. Provide immediate feedback, comprehensive hints, and track individual performance with ease.",
    linkLabel: "Try a quiz",
  },
];

// ── Capability tiles data ──────────────────────────────────────────────────────
const capabilities = [
  {
    icon: Zap,
    title: "Instant AI Generation",
    description:
      "Transform raw lecture notes, PDFs, or slide decks into fully formatted multiple choice and open questions within seconds.",
  },
  {
    icon: BarChart3,
    title: "Real-time Mastery Analytics",
    description:
      "Monitor student performance curves, spot knowledge gaps early, and track class accuracy across difficulty tiers.",
  },
  {
    icon: Layers,
    title: "Semantic Vector RAG",
    description:
      "Automatic document chunking and vector embeddings guarantee that generated questions stay 100% faithful to course content.",
  },
  {
    icon: Trophy,
    title: "Course Leaderboards",
    description:
      "Drive healthy competition with live course rankings, accuracy breakdown stats, and attempt timestamp tracking.",
  },
  {
    icon: Sliders,
    title: "Adaptive Question Controls",
    description:
      "Customize difficulty levels, answer option counts, question categories, and step-by-step hints with full educator override.",
  },
  {
    icon: ShieldCheck,
    title: "Scrambled Answer Security",
    description:
      "Fisher-Yates randomized answer positions on every attempt ensure students demonstrate true concept mastery.",
  },
];

// ── Filter tab definitions ─────────────────────────────────────────────────────
const featureTabs = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI Generation" },
  { id: "engine", label: "Assessment Engine" },
  { id: "docs", label: "Smart Processing" },
  { id: "quiz", label: "Quiz Experience" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>("all");

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
              {/* Top Badge Tag */}

              {/* Main Hero Title */}
              <h1 className="text-5xl md:text-7xl lg:text-[5.25rem] font-semibold tracking-tight leading-[1.04] text-foreground">
                Enable real{" "}
                <span className="text-muted-foreground/60 dark:text-muted-foreground/50">
                  learning.
                </span>
              </h1>

              {/* Subtitle with highlighted key phrases */}
              <p className="max-w-xl text-lg md:text-xl leading-relaxed text-muted-foreground/90 font-normal mx-auto md:mx-0">
                Cognify turns your learning materials into{" "}
                <span className="text-foreground font-medium">
                  smart assessments
                </span>
                , giving students and instructors{" "}
                <span className="text-foreground font-medium">
                  actionable insights
                </span>
                .
              </p>
              <div className="flex items-center justify-start gap-3 pt-2">
                <Link href="/courses">
                  <div className="group relative inline-flex overflow-hidden rounded-xl p-[2px] hover:scale-105 transition-transform duration-300">
                    {/* Animated glow border */}
                    <div
                      className="absolute inset-[-50%] -z-10 h-[200%] w-[200%] animate-rotate-glow bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 blur-lg"
                      style={{
                        backgroundSize: "50% 25%",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }}
                    />
                    <button className="relative cursor-pointer overflow-hidden rounded-[10px] bg-card px-8 py-4 text-base font-bold text-foreground shadow-sm transition-all duration-300">
                      <span className="relative z-20 flex items-center gap-2">
                        Get Started
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

            <div className="relative w-full aspect-square md:aspect-video lg:aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/40 to-transparent rounded-full blur-3xl opacity-50 -z-10" />
              <RubiksCube />
            </div>
          </div>

          {/* Section Divider with Light Flare */}
          <SectionLightDivider className="my-32" />

          {/* ── Features ───────────────────────────────────────────────────── */}
          <div id="features" className="mt-12">
            {/* Section heading — left-aligned, two-tone like Resend */}
            <div className="max-w-2xl mb-10">
              <h2 className="text-4xl md:text-[3.25rem] font-semibold tracking-tight leading-[1.07] text-foreground">
                Elevate your learning,{" "}
                <span className="text-muted-foreground/55">the smart way.</span>
              </h2>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md">
                Straightforward analytics, AI generation, and powerful
                management tools designed for educators and students.
              </p>
            </div>

            {/* Filter tabs — underline indicator, no icons */}
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

            {/* Feature cards — 2-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
              {visibleFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className="group relative rounded-2xl border border-border/40 bg-card/10 overflow-hidden transition-colors duration-300 hover:border-border/70"
                  >
                    {/* ── macOS window frame ── */}
                    <div className="w-full h-[20rem] bg-[#0c0c0c] border-b border-border/30 flex flex-col">
                      {/* Title bar */}
                      <div className="h-9 px-4 flex items-center shrink-0 bg-[#161616] border-b border-white/[0.04]">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className="w-3 h-3 rounded-full bg-[#FF5F57] shrink-0" />
                          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shrink-0" />
                          <div className="w-3 h-3 rounded-full bg-[#28C840] shrink-0" />
                          <span className="ml-3 text-[11px] font-mono text-white/20 truncate">
                            {feature.file}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ml-2 ${feature.badge.cls}`}
                        >
                          {feature.badge.text}
                        </span>
                      </div>

                      {/* Screenshot viewport */}
                      <div className="relative flex-1 overflow-hidden">
                        <Image
                          src={feature.image}
                          alt={feature.alt}
                          fill
                          className="object-cover object-left-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    </div>

                    {/* ── Card body ── */}
                    <div className="p-6 lg:p-7">
                      <div className="flex items-start gap-4">
                        {/* Icon chip */}
                        <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-foreground/5 border border-border/40">
                          <Icon className="h-4 w-4 text-foreground/50" />
                        </div>

                        {/* Text */}
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
                  </div>
                );
              })}
            </div>

            {/* Section Divider with Light Flare */}
            <SectionLightDivider className="my-20 md:my-28" />

            {/* ── "Everything in your control" — Resend capabilities grid ── */}
            <div className="pt-6 md:pt-10">
              {/* Left-aligned heading */}
              <div className="mb-16 max-w-lg">
                <h3 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.08]">
                  Everything in{" "}
                  <span className="text-muted-foreground/55">
                    your control.
                  </span>
                </h3>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  All the features you need to manage your quizzes, evaluate
                  student mastery, and track progress — without friction.
                </p>
              </div>

              {/* Borderless 3-column tile grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12">
                {capabilities.map((cap, idx) => {
                  const Icon = cap.icon;
                  return (
                    <div key={idx} className="space-y-3">
                      <Icon className="h-5 w-5 text-muted-foreground/50" />
                      <h4 className="text-sm font-semibold text-foreground">
                        {cap.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {cap.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section Divider with Light Flare */}
            <SectionLightDivider className="my-20 md:my-28" />

            {/* ── CTA — "Assessment reimagined. Available today." ── */}
            <div className="text-center pt-6 md:pt-10">
              <h2 className="text-4xl md:text-[3.5rem] font-semibold tracking-tight text-foreground leading-[1.06]">
                Assessment reimagined.
                <br />
                <span className="text-muted-foreground/55">
                  Available today.
                </span>
              </h2>

              <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
                <Link href="/courses">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-85 transition-opacity">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="inline-flex items-center gap-1.5 px-6 py-3 text-muted-foreground text-sm font-medium hover:text-foreground transition-colors cursor-pointer">
                    Contact us
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/30 z-10 relative">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 py-6 sm:flex-row">
          <p className="text-xs font-serif text-muted-foreground/50">
            © 2026 Cognify. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/courses" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">
              Courses
            </Link>
            <Link href="/contact" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
