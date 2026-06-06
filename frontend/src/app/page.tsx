"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  BookOpen,
  Brain,
  BarChart3,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <Header />

      <main className="pt-32 pb-32">
        <div className="mx-auto max-w-7xl px-8">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto space-y-10">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.05]">
              Master any subject with{" "}
              <span className="font-serif italic font-normal text-muted-foreground/80">
                precision.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed">
              Cognify turns your learning materials into smart assessments,
              giving students and educators actionable insights.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              {/* <Button asChild size="xl" variant="pill">
                <Link href="/register">
                  Get started free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button> */}
              <div className="relative inline-flex items-center justify-center gap-4 group">
                <div className="absolute inset-0 duration-1000 opacity-60 transitiona-all bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400 rounded-xl blur-lg filter group-hover:opacity-100 group-hover:duration-200"></div>
                <Link
                  role="button"
                  className="group relative inline-flex items-center justify-center text-base rounded-xl bg-gray-900 px-8 py-3 font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-gray-600/30"
                  title="payment"
                  href="/register"
                >
                  Get Started For Free
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 10 10"
                    height="10"
                    width="10"
                    fill="none"
                    className="mt-0.5 ml-2 -mr-1 stroke-white stroke-2"
                  >
                    <path
                      d="M0 5h7"
                      className="transition opacity-0 group-hover:opacity-100"
                    ></path>
                    <path
                      d="M1 1l4 4-4 4"
                      className="transition group-hover:translate-x-[3px]"
                    ></path>
                  </svg>
                </Link>
              </div>

              <button
                role="button"
                className="group relative inline-flex overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
              >
                <Link role="button" title="payment" href="/organizations">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600"></span>

                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-3 text-sm font-medium backdrop-blur-3xl transition-all duration-300 group-hover:bg-slate-950/90">
                    <svg
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mr-2 h-5 w-5 text-pink-500 transition-transform duration-300 group-hover:-translate-x-1"
                    >
                      <path
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                        stroke-width="2"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                      ></path>
                    </svg>

                    <span className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-semibold">
                      Browse Organization
                    </span>

                    <svg
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="ml-2 h-5 w-5 text-blue-500 transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                        stroke-width="2"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                      ></path>
                    </svg>
                  </span>
                </Link>
              </button>
            </div>
          </div>

          {/* Feature Grid */}
          <div id="features" className="mt-40 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Course Management",
                desc: "Create courses, organize materials, and build structured learning paths.",
              },
              {
                icon: Brain,
                title: "AI Question Generation",
                desc: "Generate high-quality questions instantly from any topic using AI.",
              },
              {
                icon: BarChart3,
                title: "Learning Analytics",
                desc: "Track your progress with detailed analytics and personalized insights.",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="group bg-card hover:border-primary/20 transition-all duration-300"
              >
                <CardContent className="p-10 space-y-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground font-serif leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <div className="border-t border-border/30">
        <div className="mx-auto max-w-7xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/50 font-serif">
            © 2026 Cognify. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/40 font-serif italic">
            Built for students and educators worldwide
          </p>
        </div>
      </div>
    </div>
  );
}
