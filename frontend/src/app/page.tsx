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
            <Badge variant="outline" className="px-4 py-1.5 text-sm">
              AI-powered learning
            </Badge>
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
              <Button asChild size="xl" variant="pill">
                <Link href="/register">
                  Get started free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="outline"
                className="rounded-full"
              >
                <Link href="/organizations" className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Browse organizations
                </Link>
              </Button>
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

      {/* Footer */}
      <footer className="border-t border-border/40 py-16 bg-card/10">
        <div className="mx-auto max-w-7xl px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-sm font-semibold tracking-tight">
            Cognify
            <span className="text-muted-foreground font-normal">.ai</span>
          </div>
          <div className="text-sm font-normal tracking-tight text-muted-foreground">
            Built for students and educators worldwide
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
          <div className="text-xs text-muted-foreground/60 font-serif">
            © 2026 Cognify. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
