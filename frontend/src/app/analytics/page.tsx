"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { AttemptStats, Course, CourseProgress } from "@/types";
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  FileQuestion,
  Users,
  Target,
  Loader2,
  Activity,
  Award,
} from "lucide-react";

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AttemptStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<
    Record<string, CourseProgress>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (
      !authLoading &&
      (!user || !["ADMIN", "INSTRUCTOR"].includes(user.role))
    ) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user) return;
      try {
        const [coursesData, statsData] = await Promise.all([
          apiGet<Course[]>("/courses"),
          apiGet<AttemptStats>("/attempts/stats").catch(() => null),
        ]);
        setCourses(coursesData || []);
        if (statsData) setStats(statsData);

        // Fetch per-course progress
        const progressMap: Record<string, CourseProgress> = {};
        for (const course of coursesData || []) {
          try {
            const progressData = await apiGet<CourseProgress>(
              `/attempts/course/${course.id}`,
            );
            progressMap[course.id] = progressData;
          } catch {
            // ignore
          }
        }
        setCourseProgress(progressMap);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  const totalQuestions = courses.reduce(
    (acc, c) => acc + (c._count?.questions || 0),
    0,
  );
  const totalMaterials = courses.reduce(
    (acc, c) => acc + (c._count?.materials || 0),
    0,
  );
  const avgProgress =
    Object.values(courseProgress).length > 0
      ? Math.round(
          Object.values(courseProgress).reduce(
            (acc, p) => acc + p.percentage,
            0,
          ) / Object.values(courseProgress).length,
        )
      : 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <BarChart3 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  Analytics
                </h1>
                <p className="text-muted-foreground font-serif text-lg leading-relaxed">
                  Platform performance metrics and learning trajectory insights.
                </p>
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="px-4 py-1.5 h-fit text-[10px] font-bold uppercase tracking-widest bg-primary/5"
          >
            Real-time Data
          </Badge>
        </div>

        {/* Overview Metrics */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            {
              label: "Total Courses",
              value: courses.length,
              icon: BookOpen,
              badge: "Library",
            },
            {
              label: "Question Bank",
              value: totalQuestions,
              icon: FileQuestion,
              badge: "Units",
            },
            {
              label: "Learning Assets",
              value: totalMaterials,
              icon: Activity,
              badge: "Materials",
            },
            {
              label: "Avg. Mastery",
              value: `${avgProgress}%`,
              icon: Target,
              badge: "Progress",
            },
          ].map((item, i) => (
            <Card
              key={i}
              className="hover:bg-secondary/20 transition-all duration-300"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold tracking-widest uppercase"
                  >
                    {item.badge}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {item.label}
                  </p>
                  <p className="text-4xl font-semibold tracking-tighter text-foreground">
                    {item.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Attempt Analytics */}
        {stats && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">
                Assessment Metrics
              </h2>
              <div className="h-[1px] flex-1 mx-8 bg-border/40" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  label: "Total Attempts",
                  value: stats.overall.total,
                  icon: BarChart3,
                  desc: "Total assessments recorded across all courses",
                },
                {
                  label: "Correct Responses",
                  value: stats.overall.correct,
                  icon: Award,
                  desc: "Successfully validated knowledge units",
                },
                {
                  label: "Accuracy Rate",
                  value: `${stats.overall.percentage}%`,
                  icon: TrendingUp,
                  desc: "Overall platform performance threshold",
                },
              ].map((metric, i) => (
                <Card
                  key={i}
                  className="hover:bg-secondary/20 transition-colors"
                >
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                        <metric.icon className="h-5 w-5" />
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase tracking-widest"
                      >
                        Metrics
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        {metric.label}
                      </p>
                      <p className="text-4xl font-semibold text-foreground tracking-tighter">
                        {metric.value}
                      </p>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground font-serif italic">
                      {metric.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Per-Course Breakdown */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Course Performance
            </h2>
            <div className="h-[1px] flex-1 mx-8 bg-border/40" />
          </div>

          {courses.length === 0 ? (
            <Card className="border-dashed py-16 bg-card/50">
              <CardContent className="text-center space-y-4 pt-0">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/20" />
                <p className="text-muted-foreground font-serif text-lg italic">
                  No courses to analyze yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => {
                const progress = courseProgress[course.id];
                const pct = progress?.percentage || 0;
                const answered = progress?.answered || 0;
                const total =
                  progress?.totalQuestions || course._count?.questions || 0;

                return (
                  <Card
                    key={course.id}
                    className="group hover:bg-secondary/10 transition-colors duration-300"
                  >
                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-xl tracking-tight">
                            {course.name}
                          </h3>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <FileQuestion className="h-3.5 w-3.5 opacity-40" />
                              {course._count?.questions || 0} questions
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 opacity-40" />
                              {answered} / {total} answered
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={pct >= 80 ? "default" : "secondary"}
                          className="px-4 py-1.5 h-fit self-start"
                        >
                          {pct}% Mastery
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-1000 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground">
                            Engagement
                          </span>
                          <span className="text-primary">{pct}% Complete</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
