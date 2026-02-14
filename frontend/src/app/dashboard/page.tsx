"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { Organization, Course, AttemptStats, PlanLimits } from "@/types";
import { FeatureGate } from "@/components/ui";
import {
  BookOpen,
  FileQuestion,
  Users,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Lock,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<AttemptStats | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;

      try {
        const promises: Promise<any>[] = [apiGet<Course[]>("/courses")];

        if (user) {
          promises.push(apiGet<Organization>("/organizations/me"));
          promises.push(apiGet<PlanLimits>("/organizations/limits"));
          if (user.role === "STUDENT") {
            promises.push(apiGet<AttemptStats>("/attempts/stats"));
          }
        }

        const results = await Promise.all(promises);

        const coursesData = results[0];
        setCourses(
          Array.isArray(coursesData) ? coursesData : coursesData?.data || [],
        );

        if (user) {
          setOrganization(results[1]);
          setLimits(results[2]);
          if (user.role === "STUDENT" && results[3]) {
            setStats(results[3]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  if (!isMounted) return null;

  const isAdmin = user?.role === "ADMIN";
  const isInstructor = user?.role === "INSTRUCTOR";
  const isStudent = user?.role === "STUDENT" || !user;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
        {/* Navigation & Welcome */}
        {!user ? (
          <Card className="p-10 md:p-16 border-border/60 overflow-hidden relative">
            <div className="relative z-10 max-w-3xl space-y-8">
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary/5"
              >
                AI-Powered Synthesis
              </Badge>
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.05]">
                Master any subject with{" "}
                <span className="font-serif italic font-normal text-muted-foreground/80">
                  precision.
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed font-serif">
                Cognify synthesizes personalized assessments, providing
                data-driven trajectory for students and educators.
              </p>
              <div className="flex flex-wrap gap-6 pt-4">
                <Button asChild size="xl" variant="pill">
                  <Link href="/register">
                    Get started free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="xl"
                  className="rounded-full"
                >
                  <Link href="/courses">Browse courses</Link>
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Dashboard
              </h1>
              <div className="flex items-center gap-3 text-muted-foreground font-serif text-lg">
                <span className="text-foreground font-semibold font-sans">
                  {user.firstName} {user.lastName}
                </span>
                <span className="opacity-40">•</span>
                <span>{user.organizationName}</span>
                <span className="opacity-40">•</span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-widest bg-primary/5"
                >
                  {user.role}
                </Badge>
              </div>
            </div>
            {(isAdmin || isInstructor) && (
              <div className="flex gap-4">
                <Link href="/courses">
                  <Button variant="pill" size="lg">
                    <Plus className="h-5 w-5 mr-1" />
                    New Course
                  </Button>
                </Link>
                <Link href="/ai-generate">
                  <Button variant="outline" size="lg" className="rounded-full">
                    <Sparkles className="h-5 w-5 mr-1" />
                    AI Synthesis
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Audit Metrics */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="hover:bg-secondary/20 transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold tracking-widest uppercase"
                >
                  Library
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  Courses
                </p>
                <p className="text-4xl font-semibold tracking-tighter text-foreground">
                  {organization?.courseCount || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          {(isAdmin || isInstructor) && (
            <>
              <Card className="hover:bg-secondary/20 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                      <FileQuestion className="h-5 w-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold tracking-widest uppercase"
                    >
                      Bank
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Questions
                    </p>
                    <p className="text-4xl font-semibold tracking-tighter text-foreground">
                      {courses.reduce(
                        (acc, c) => acc + (c._count?.questions || 0),
                        0,
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:bg-secondary/20 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold tracking-widest uppercase"
                    >
                      Staff
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Members
                    </p>
                    <p className="text-4xl font-semibold tracking-tighter text-foreground">
                      {organization?.userCount || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {(isStudent || !user) && (
            <>
              <Card className="relative group hover:bg-secondary/20 transition-all duration-300">
                {!user && (
                  <div className="absolute top-4 right-4 z-10">
                    <Lock className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-500/5 text-green-700">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold tracking-widest uppercase"
                    >
                      Volume
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Questions answered
                    </p>
                    <p className="text-4xl font-semibold tracking-tighter text-foreground">
                      {user && stats ? stats.overall.total : "128"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative group hover:bg-secondary/20 transition-all duration-300">
                {!user && (
                  <div className="absolute top-4 right-4 z-10">
                    <Lock className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold tracking-widest uppercase"
                    >
                      Recall
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Accuracy
                    </p>
                    <p className="text-4xl font-semibold tracking-tighter text-foreground">
                      {user && stats ? `${stats.overall.percentage}%` : "92%"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isAdmin && organization && (
            <Card className="hover:bg-secondary/20 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold tracking-widest uppercase"
                  >
                    Tier
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    License Status
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-foreground uppercase pt-1">
                    {organization.plan} Plan
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Course Exploration */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isStudent ? "Your courses" : "Your courses"}
            </h2>
            <Link href="/courses">
              <Button
                variant="link"
                className="text-primary text-[10px] font-bold uppercase tracking-widest p-0 h-auto hover:opacity-70 transition-opacity"
              >
                View all
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-secondary/50 rounded-[32px] h-64"
                />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <Card className="border-dashed py-24 bg-card/50">
              <CardContent className="text-center space-y-6 pt-0 p-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/20" />
                <p className="text-muted-foreground font-serif text-lg italic">
                  No courses yet.
                </p>
                {(isAdmin || isInstructor) && (
                  <Button asChild variant="pill">
                    <Link href="/courses">Create a course</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(courses || []).slice(0, 6).map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="group h-full hover:bg-card hover:border-primary/20 transition-all duration-300 flex flex-col">
                    <CardHeader className="p-8">
                      <div className="space-y-3">
                        <CardTitle className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                          {course.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground font-serif line-clamp-3 leading-relaxed min-h-[4.5rem]">
                          {course.description || "No description yet."}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 pt-0 mt-auto">
                      <div className="pt-6 border-t border-border/40 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-2">
                          <FileQuestion className="h-3.5 w-3.5 opacity-40" />
                          {course._count?.questions || 0} Units
                        </span>
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 opacity-40" />
                          {course._count?.materials || 0} Assets
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Enhanced Guest CTA */}
        {!user && (
          <Card className="p-12 md:p-16 text-center bg-primary text-primary-foreground relative overflow-hidden group border-none">
            {/* Background Texture/Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[40px] border-primary-foreground" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full border-[20px] border-primary-foreground" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-10">
              <Badge
                variant="outline"
                className="px-6 py-2 border-primary-foreground/30 text-primary-foreground text-[10px] font-bold uppercase tracking-[0.3em] bg-primary-foreground/5"
              >
                AI-powered learning
              </Badge>
              <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1]">
                Revolutionize your{" "}
                <span className="font-serif italic font-normal text-primary-foreground/70">
                  learning.
                </span>
              </h2>
              <p className="text-primary-foreground/80 text-xl font-serif leading-relaxed">
                Join thousands of students and instructors leveraging Cognify to
                automate assessments and archive progression.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                <FeatureGate
                  variant="prompt"
                  title="Create account"
                  description="Sign up to save your progress and unlock analytics."
                >
                  <Button
                    size="xl"
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full sm:w-auto px-12 rounded-full border-none shadow-xl shadow-black/10"
                  >
                    Get started free
                  </Button>
                </FeatureGate>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
