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
              Pedagogical Excellence powered by AI
            </Badge>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.05]">
              Master any subject with{" "}
              <span className="font-serif italic font-normal text-muted-foreground/80">
                unrivaled precision.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground font-serif leading-relaxed">
              Cognify synthesizes your learning materials into cognitive
              assessments, providing data-driven insights for students and
              educators alike.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              <Button asChild size="xl" variant="pill">
                <Link href="/register">
                  Start your free trial
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
                  Explore Institutions
                </Link>
              </Button>
            </div>
          </div>

          {/* Feature Grid */}
          <div id="features" className="mt-40 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Curriculum Design",
                desc: "Architect complex courses, curate research materials, and organize content within a unified pedagogical framework.",
              },
              {
                icon: Brain,
                title: "AI Question Synthesis",
                desc: "Utilize state-of-the-art foundations to generate high-quality assessment items instantly from any subject domain.",
              },
              {
                icon: BarChart3,
                title: "Cognitive Analytics",
                desc: "Monitor intellectual growth through granular performance analytics and personalized competency mapping.",
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

          {/* Social Proof / Trust Section */}
          <div className="mt-40 pt-20 border-t border-border/60 text-center">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-12">
              Trusted by research institutions and leading educators
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 grayscale opacity-40">
              {/* These would be logos in a real app */}
              <div className="text-2xl font-bold tracking-tighter">
                STANFORD
              </div>
              <div className="text-2xl font-bold tracking-tighter italic">
                MIT
              </div>
              <div className="text-2xl font-bold tracking-tighter">HARVARD</div>
              <div className="text-2xl font-bold tracking-tighter italic font-serif">
                Aalto
              </div>
            </div>
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
            © 2026 Cognify Engineering. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
