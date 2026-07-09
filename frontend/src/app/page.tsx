"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, BarChart3, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout";
import { useAuth } from "@/lib/auth";
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
          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center pt-8 md:pt-16">
            {/* Left Column: Text */}
            <div className="space-y-8 text-center md:text-left">
              <h1 className="text-5xl font-semibold tracking-tight text-foreground leading-[1.05] md:text-7xl">
                Learn faster with{" "}
                <span className="font-serif font-normal italic text-muted-foreground/80 block mt-2">
                  any subject.
                </span>
              </h1>

              <p className="mx-auto md:mx-0 max-w-2xl text-xl leading-relaxed text-muted-foreground">
                Cognify turns your learning materials into smart assessments,
                giving students and educators actionable insights.
              </p>

              <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                <Link href="/courses">
                  <Button size="lg" className="rounded-full">
                    Start learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="ghost" className="rounded-full">
                    Create an account
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Rubik's Cube */}
            <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/40 to-transparent rounded-full blur-3xl opacity-50 -z-10" />
              <RubiksCube />
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
                className="group relative overflow-hidden bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/0 transition-colors duration-300 group-hover:bg-primary/40" />
                <CardContent className="space-y-8 p-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-transform group-hover:scale-110">
                    <feature.icon className="h-6 w-6" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      {feature.title}
                    </h3>

                    <p className="font-serif leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
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
