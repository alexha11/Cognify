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
import { PageHeader, StatCard, SectionHeader, EmptyState } from "@/components/ui";
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
  Loader2,
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <PageHeader
          icon={Shield}
          title="Administrative Control"
          description="Unified platform governance and course management."
          badge="Systems Administrator"
        />

        {/* Quick Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Courses", icon: BookOpen, value: "--", badge: "Audit" },
            { label: "Synthesis Units", icon: FileQuestion, value: "--", badge: "Audit" },
            { label: "Platform Members", icon: Users, value: "--", badge: "Audit" },
            { label: "Active Sessions", icon: BarChart3, value: "--", badge: "Audit" },
          ].map((stat, i) => (
            <StatCard
              key={i}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              badge={stat.badge}
            />
          ))}
        </div>

        {/* Admin Actions Grid */}
        <div className="space-y-8">
          <SectionHeader title="Platform Governance" />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Course Oversight",
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
