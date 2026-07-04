"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatCard, SectionHeader, EmptyState, ProgressBar } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { AttemptStats, Course, CourseProgress } from "@/types";
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  FileQuestion,
  Activity,
  Target,
  Loader2,
  Award,
  Users,
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
      <div className="max-w-7xl mx-auto space-y-12">
        <PageHeader
          icon={BarChart3}
          title="Analytics"
          description="Platform performance metrics and learning trajectory insights."
          badge="Real-time Data"
        />

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
            <StatCard
              key={i}
              icon={item.icon}
              label={item.label}
              value={item.value}
              badge={item.badge}
            />
          ))}
        </div>

        {/* Attempt Analytics */}
        {stats && (
          <section className="space-y-8">
            <SectionHeader title="Assessment Metrics" />
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
                <StatCard
                  key={i}
                  icon={metric.icon}
                  label={metric.label}
                  value={metric.value}
                  badge="Metrics"
                  description={metric.desc}
                />
              ))}
            </div>
          </section>
        )}

        {/* Per-Course Breakdown */}
        <section className="space-y-8">
          <SectionHeader title="Course Performance" />

          {courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              message="No courses to analyze yet."
            />
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
                      <ProgressBar percentage={pct} label="Engagement" />
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
