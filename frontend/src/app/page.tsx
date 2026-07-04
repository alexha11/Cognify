"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, BarChart3 } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <Header />

      {/* Main content grows to fill remaining screen height */}
      <main className="flex-1 pt-32 pb-32">
        <div className="mx-auto max-w-7xl px-8">
          {/* Hero Section */}
          <div className="mx-auto max-w-4xl space-y-10 text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-foreground leading-[1.05] md:text-7xl">
              Learn faster with{" "}
              <span className="font-serif font-normal italic text-muted-foreground/80">
                any subject.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground">
              Cognify turns your learning materials into smart assessments,
              giving students and educators actionable insights.
            </p>
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
                className="group bg-card transition-all duration-300 hover:border-primary/20"
              >
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

      {/* Footer */}
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
