"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  BookOpen,
  FileQuestion,
  Users,
  Settings,
  Sparkles,
  FileText,
  BarChart3,
  Shield,
  ArrowRight,
} from "lucide-react";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <Shield className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  Administrative Control
                </h1>
                <p className="text-muted-foreground font-serif text-lg leading-relaxed">
                  Unified platform governance and curriculum management.
                </p>
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="px-4 py-1.5 h-fit text-[10px] font-bold uppercase tracking-widest bg-primary/5"
          >
            Systems Administrator
          </Badge>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Curriculum", icon: BookOpen, value: "--" },
            { label: "Synthesis Units", icon: FileQuestion, value: "--" },
            { label: "Platform Members", icon: Users, value: "--" },
            { label: "Active Sessions", icon: BarChart3, value: "--" },
          ].map((stat, i) => (
            <Card
              key={i}
              className="hover:bg-secondary/20 transition-colors duration-300"
            >
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold tracking-widest uppercase bg-background"
                  >
                    Audit
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-semibold tracking-tighter text-foreground">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Actions Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Platform Governance
            </h2>
            <div className="h-[1px] flex-1 mx-8 bg-border/40" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Curriculum Oversight",
                desc: "Monitor and organize all institutional course structures.",
                href: "/courses",
                icon: BookOpen,
                label: "Courses",
              },
              {
                title: "Synthesis Engine",
                desc: "Access AI capabilities to generate assessment material.",
                href: "/ai-generate",
                icon: Sparkles,
                label: "AI Systems",
              },
              {
                title: "Question Validation",
                desc: "Pedagogical review and authorization of question banks.",
                href: "/courses",
                icon: FileQuestion,
                label: "Validation",
              },
              {
                title: "Institutional Configuration",
                desc: "Manage organizational parameters and security protocols.",
                href: "/dashboard",
                icon: Settings,
                label: "Settings",
              },
              {
                title: "Asset Repository",
                desc: "Centralized management of all research and course materials.",
                href: "/courses",
                icon: FileText,
                label: "Materials",
              },
              {
                title: "Efficacy Analytics",
                desc: "Deep-dive into platform-wide learning metrics.",
                href: "/progress",
                icon: BarChart3,
                label: "Analytics",
              },
            ].map((tool, i) => (
              <Link key={i} href={tool.href}>
                <Card className="group h-full hover:border-primary/30 transition-all duration-300">
                  <CardHeader className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary group-hover:bg-primary/10 transition-colors">
                        <tool.icon className="h-6 w-6" />
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold tracking-widest uppercase"
                      >
                        {tool.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-semibold mb-3 tracking-tight group-hover:text-primary transition-colors">
                      {tool.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-serif text-base leading-relaxed">
                      {tool.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 pt-0">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                    >
                      Access Terminal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Log Placeholder */}
        <section className="space-y-6 pt-6">
          <Card className="border-dashed bg-transparent">
            <CardHeader className="p-8 text-center sm:text-left">
              <CardTitle className="text-xl font-semibold">
                System Audit Log
              </CardTitle>
              <CardDescription className="font-serif">
                Platform-wide events and administrative actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-16 pt-0 text-center">
              <div className="py-12 flex flex-col items-center space-y-4">
                <div className="h-12 w-12 rounded-full border border-border flex items-center justify-center text-muted-foreground/30 font-serif">
                  !
                </div>
                <p className="text-muted-foreground font-serif italic text-lg opacity-60">
                  System event streaming beginning soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
