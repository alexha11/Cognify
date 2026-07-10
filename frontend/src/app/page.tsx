"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { Header } from "@/components/layout";
import { useAuth } from "@/lib/auth";
// Direct import — no dynamic(), no loading flash, no hydration mismatch
import { RubiksCube } from "@/components/ui/rubiks-cube";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <Header />

      <main className="flex-1 pt-32 pb-32">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center">
            {/* Left column — text */}
            <div className="space-y-8 text-center md:text-left">
              <h1 className="text-5xl font-semibold tracking-tight text-foreground leading-[1.05] md:text-7xl">
                Enable real learning
              </h1>

              <p className="max-w-lg text-xl leading-relaxed text-muted-foreground">
                Cognify turns your learning materials into smart assessments,
                giving students and instructors actionable insights.
              </p>

              <div className="flex items-center justify-start md:justify-start gap-3 pt-2">
                <Link href="/courses">
                  <div className="group relative inline-flex overflow-hidden rounded-xl p-[2px] hover:scale-105 transition-transform duration-300">
                    {/* Animated glow */}
                    <div
                      className="absolute inset-[-50%] -z-10 h-[200%] w-[200%] animate-rotate-glow bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 blur-lg"
                      style={{
                        backgroundSize: "50% 25%",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }}
                    />

                    <button className="relative cursor-pointer overflow-hidden rounded-[10px] bg-white px-8 py-4 text-base font-bold text-black shadow-sm transition-all duration-300">
                      <span className="relative z-20 flex items-center gap-2">
                        Get Started
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>

                      {/* Shine */}
                      <span className="absolute left-[-75%] top-0 z-10 h-full w-[50%] rotate-12 bg-black/10 blur-lg transition-all duration-1000 ease-in-out group-hover:left-[125%]" />

                      {/* Border animation */}
                      <span className="absolute left-0 top-0 block h-[20%] w-1/2 rounded-tl-[10px] border-l-2 border-t-2 border-black transition-all duration-300" />
                      <span className="absolute right-0 top-0 block h-[60%] w-1/2 rounded-tr-[10px] border-r-2 border-t-2 border-black transition-all duration-300 group-hover:h-[90%]" />
                      <span className="absolute bottom-0 left-0 block h-[60%] w-1/2 rounded-bl-[10px] border-b-2 border-l-2 border-black transition-all duration-300 group-hover:h-[90%]" />
                      <span className="absolute bottom-0 right-0 block h-[20%] w-1/2 rounded-br-[10px] border-b-2 border-r-2 border-black transition-all duration-300" />
                    </button>
                  </div>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="ghost" className="rounded-full">
                    Create an account
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative w-full aspect-square md:aspect-video lg:aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/40 to-transparent rounded-full blur-3xl opacity-50 -z-10" />
              <RubiksCube />
            </div>
          </div>

          <div id="features" className="mt-40">
            <div className="flex flex-col gap-4 text-center mb-24">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                Elevate your learning in a simple, intuitive way.
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Straightforward analytics, AI generation, and powerful management tools designed for educators and students.
              </p>
            </div>

            <div className="flex flex-col gap-48 md:gap-64">
              {/* Feature 1: AI Generation */}
              <div className="group flex flex-col md:flex-row items-center gap-12 md:gap-20">
                {/* Text Area */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-foreground mb-2">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight text-foreground">AI-Powered Question Generation</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Instantly convert your course materials into high-quality assessments. Get full control over question types, difficulty levels, and automatic grading with just a click.
                  </p>
                  <Link href="/courses" className="text-base font-medium text-emerald-600 hover:text-emerald-700 transition-colors mt-4 flex items-center gap-1 w-fit group/link">
                    Explore generation <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>

                {/* Visual Area */}
                <div className="flex-1 w-full relative h-[26rem] rounded-3xl border border-border/50 bg-muted/20 overflow-hidden flex items-center justify-center p-8 transition-colors duration-300 group-hover:bg-muted/40 shadow-sm">
                  {/* Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-400/20 blur-[100px] rounded-full transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
                  
                  {/* Mockup UI */}
                  <div className="relative z-10 w-full max-w-[300px] rounded-2xl border border-border/50 bg-background/95 p-8 backdrop-blur-xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] flex flex-col items-center gap-5 transition-transform duration-500 group-hover:-translate-y-2">
                    <div className="w-20 h-20 rounded-2xl border border-border/50 bg-gradient-to-b from-muted/50 to-transparent flex items-center justify-center mb-2 shadow-sm">
                      <Brain className="h-10 w-10 text-emerald-500" />
                    </div>
                    <div className="text-center space-y-1.5 w-full">
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Source Material</div>
                      <div className="text-lg text-foreground font-medium flex items-center justify-center gap-2">
                        Biology_101.pdf
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="w-full h-px bg-border/50 my-2"></div>
                    
                    <div className="flex justify-between w-full text-sm">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Questions</span>
                        <span className="text-foreground font-medium text-base">15 Generated</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Status</span>
                        <span className="text-emerald-600 font-medium flex items-center gap-1.5 text-base">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                          Ready
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2: Modern Engine (Reversed) */}
              <div className="group flex flex-col md:flex-row-reverse items-center gap-12 md:gap-20">
                {/* Text Area */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-foreground mb-2">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight text-foreground">Modern Assessment Engine</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    An intuitive engine that makes it easy for anyone to create and manage questions across all difficulty levels. Monitor student engagement with real-time analytics.
                  </p>
                  <Link href="/courses" className="text-base font-medium text-blue-600 hover:text-blue-700 transition-colors mt-4 flex items-center gap-1 w-fit group/link">
                    View analytics <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>

                {/* Visual Area */}
                <div className="flex-1 w-full relative h-[26rem] rounded-3xl border border-border/50 bg-muted/20 overflow-hidden flex items-center justify-center p-8 transition-colors duration-300 group-hover:bg-muted/40 shadow-sm">
                  {/* Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/20 blur-[100px] rounded-full transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
                  
                  {/* Mockup UI */}
                  <div className="relative z-10 w-full max-w-[340px] rounded-2xl border border-border/50 bg-background/95 p-8 backdrop-blur-xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] flex flex-col gap-8 transition-transform duration-500 group-hover:-translate-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Average Score</div>
                        <div className="text-5xl text-foreground font-semibold tracking-tight">85%</div>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border/50 shadow-sm">
                        <BarChart3 className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            Easy Level
                          </div>
                          <span className="text-foreground font-medium">92%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[92%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm pt-2">
                          <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div>
                            Hard Level
                          </div>
                          <span className="text-foreground font-medium">41%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 w-[41%] rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feature 3: Smart Document Processing */}
              <div className="group flex flex-col md:flex-row items-center gap-12 md:gap-20">
                {/* Text Area */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-foreground mb-2">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight text-foreground">Smart Document Processing</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Upload your course materials in any format. Our system automatically processes, chunks, and creates semantic embeddings to ensure the AI understands every detail.
                  </p>
                  <Link href="/courses" className="text-base font-medium text-indigo-600 hover:text-indigo-700 transition-colors mt-4 flex items-center gap-1 w-fit group/link">
                    Upload materials <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>

                {/* Visual Area */}
                <div className="flex-1 w-full relative h-[26rem] rounded-3xl border border-border/50 bg-muted/20 overflow-hidden flex items-center justify-center p-8 transition-colors duration-300 group-hover:bg-muted/40 shadow-sm">
                  {/* Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400/20 blur-[100px] rounded-full transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
                  
                  {/* Mockup UI */}
                  <div className="relative z-10 w-full max-w-[320px] rounded-2xl border border-border/50 bg-background/95 p-6 backdrop-blur-xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] flex flex-col gap-4 transition-transform duration-500 group-hover:-translate-y-2">
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background shadow-sm">
                      <div className="p-3 bg-indigo-50 text-indigo-500 rounded-lg">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-medium text-foreground">Lecture_Slides.pdf</span>
                        <span className="text-sm text-muted-foreground">Processed • 2.4 MB</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background shadow-sm">
                      <div className="p-3 bg-indigo-50 text-indigo-500 rounded-lg">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-medium text-foreground">Syllabus_2026.docx</span>
                        <span className="text-sm text-muted-foreground">Processed • 1.1 MB</span>
                      </div>
                    </div>

                    <div className="mt-3 text-center text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 py-3 rounded-xl shadow-inner">
                      Semantic embeddings active
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 4: Interactive Quiz Experience (Reversed) */}
              <div className="group flex flex-col md:flex-row-reverse items-center gap-12 md:gap-20">
                {/* Text Area */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-foreground mb-2">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                      <Brain className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight text-foreground">Interactive Quiz Experience</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Deliver a sleek, fast quiz interface for your students. Provide immediate feedback, comprehensive hints, and track individual performance with ease.
                  </p>
                  <Link href="/courses" className="text-base font-medium text-orange-600 hover:text-orange-700 transition-colors mt-4 flex items-center gap-1 w-fit group/link">
                    Try a quiz <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>

                {/* Visual Area */}
                <div className="flex-1 w-full relative h-[26rem] rounded-3xl border border-border/50 bg-muted/20 overflow-hidden flex items-center justify-center p-8 transition-colors duration-300 group-hover:bg-muted/40 shadow-sm">
                  {/* Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-400/20 blur-[100px] rounded-full transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
                  
                  {/* Mockup UI */}
                  <div className="relative z-10 w-full max-w-[320px] rounded-2xl border border-border/50 bg-background/95 p-6 backdrop-blur-xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] flex flex-col gap-5 transition-transform duration-500 group-hover:-translate-y-2">
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Progress</span>
                      <span className="text-base font-bold text-orange-500">3/4 Correct</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border border-border/50 bg-background text-sm text-foreground flex items-center gap-3 opacity-50 grayscale shadow-sm">
                        <div className="w-5 h-5 rounded-full border border-muted-foreground/50"></div>
                        <span className="font-medium">Option A</span>
                      </div>
                      <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5 text-green-700 flex items-center gap-3 relative overflow-hidden shadow-[0_0_16px_rgba(34,197,94,0.1)]">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500"></div>
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="font-medium text-base">Option B (Correct)</span>
                      </div>
                      <div className="p-4 rounded-xl border border-border/50 bg-background text-sm text-foreground flex items-center gap-3 opacity-50 grayscale shadow-sm">
                        <div className="w-5 h-5 rounded-full border border-muted-foreground/50"></div>
                        <span className="font-medium">Option C</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/30">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 py-6 sm:flex-row">
          <p className="text-xs font-serif text-muted-foreground/50">
            © 2026 Cognify. All rights reserved.
          </p>
          <p className="text-xs font-serif italic text-muted-foreground/40">
            Built for students and educators worldwide
          </p>
        </div>
      </footer>
    </div>
  );
}
