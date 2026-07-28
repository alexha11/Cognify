"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { AttemptStats, Course, CourseProgress } from "@/types";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  FileQuestion,
  Target,
  Loader2,
  Award,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Users,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";

type SortKey = "name" | "completion" | "accuracy" | "questions";
type SortDir = "asc" | "desc";

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AttemptStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<
    Record<string, CourseProgress>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("completion");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/");
      else if (!["ADMIN", "INSTRUCTOR"].includes(user.role)) router.push("/dashboard");
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

        const progressMap: Record<string, CourseProgress> = {};
        for (const course of coursesData || []) {
          try {
            progressMap[course.id] = await apiGet<CourseProgress>(
              `/attempts/course/${course.id}`,
            );
          } catch {}
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
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalQuestions = courses.reduce(
    (acc, c) => acc + (c._count?.questions || 0),
    0,
  );
  const totalMaterials = courses.reduce(
    (acc, c) => acc + (c._count?.materials || 0),
    0,
  );
  const progressValues = Object.values(courseProgress);
  const avgCompletion =
    progressValues.length > 0
      ? Math.round(
          progressValues.reduce((a, p) => a + p.percentage, 0) /
            progressValues.length,
        )
      : 0;

  // Per-course enriched data
  const enriched = courses.map((c) => {
    const p = courseProgress[c.id];
    const completion = p?.percentage || 0;
    const answered = p?.answered || 0;
    const total = p?.totalQuestions || c._count?.questions || 0;
    const correct = p?.correct || 0;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return {
      ...c,
      completion,
      answered,
      total,
      correct,
      accuracy,
      progress: p,
    };
  });

  const sortedCourses = [...enriched].sort((a, b) => {
    let va: number | string = 0,
      vb: number | string = 0;
    if (sortKey === "name") {
      va = a.name;
      vb = b.name;
    } else if (sortKey === "completion") {
      va = a.completion;
      vb = b.completion;
    } else if (sortKey === "accuracy") {
      va = a.accuracy;
      vb = b.accuracy;
    } else if (sortKey === "questions") {
      va = a.total;
      vb = b.total;
    }
    if (typeof va === "string")
      return sortDir === "asc"
        ? va.localeCompare(vb as string)
        : (vb as string).localeCompare(va);
    return sortDir === "asc"
      ? (va as number) - (vb as number)
      : (vb as number) - (va as number);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? (
      <Minus className="h-3 w-3 opacity-30" />
    ) : sortDir === "desc" ? (
      <ChevronDown className="h-3 w-3" />
    ) : (
      <ChevronUp className="h-3 w-3" />
    );

  // Highlights
  const activeCourses = enriched.filter((c) => c.answered > 0);
  const bestCourse =
    activeCourses.length > 0
      ? activeCourses.reduce((b, c) => (c.completion > b.completion ? c : b))
      : null;
  const needsAttention = enriched.filter(
    (c) => c.answered > 0 && (c.completion < 40 || c.accuracy < 50),
  );

  const masteryLabel = (pct: number) =>
    pct >= 80
      ? "Mastered"
      : pct >= 50
        ? "In progress"
        : pct > 0
          ? "Needs work"
          : "Not started";
  const masteryColor = (pct: number) =>
    pct >= 80
      ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-300/60 text-emerald-700 dark:text-emerald-400"
      : pct >= 50
        ? "bg-primary/10 border-primary/20 text-primary"
        : pct > 0
          ? "bg-amber-50 dark:bg-amber-950/25 border-amber-300/60 text-amber-700 dark:text-amber-400"
          : "bg-muted border-border/50 text-muted-foreground";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Platform performance metrics and learning progress.
            </p>
          </div>
        </div>

        {/* ── Overview stat grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Courses", value: courses.length, icon: BookOpen },
            { label: "Questions", value: totalQuestions, icon: FileQuestion },
            { label: "Materials", value: totalMaterials, icon: BarChart3 },
            {
              label: "Avg. completion",
              value: `${avgCompletion}%`,
              icon: Target,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-background border border-border/50 space-y-2"
            >
              <item.icon className="h-4 w-4 text-muted-foreground/50" />
              <p className="text-2xl font-semibold text-foreground tracking-tight">
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {/* ── Assessment metrics ── */}
        {stats && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">
              Assessment metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Total attempts",
                  value: stats.overall.total,
                  sub: "Assessments recorded",
                  icon: BarChart3,
                },
                {
                  label: "Correct answers",
                  value: stats.overall.correct,
                  sub: "Validated responses",
                  icon: Award,
                },
                {
                  label: "Accuracy rate",
                  value: `${stats.overall.percentage}%`,
                  sub: "Overall performance",
                  icon: TrendingUp,
                },
              ].map((m, i) => (
                <Card key={i} className="border-border/50 shadow-sm">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <m.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-foreground tracking-tight">
                        {m.value}
                      </p>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {m.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Highlights ── */}
        {(bestCourse || needsAttention.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bestCourse && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-300/60 dark:border-emerald-700/50">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-0.5">
                    Best performing
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {bestCourse.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bestCourse.completion}% completion · {bestCourse.accuracy}%
                    accuracy
                  </p>
                </div>
              </div>
            )}
            {needsAttention.length > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-300/60 dark:border-amber-700/50">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-0.5">
                    Needs attention
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {needsAttention.length}{" "}
                    {needsAttention.length === 1 ? "course" : "courses"} below
                    threshold
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {needsAttention.map((c) => c.name).join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Course performance table ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Course performance
            </h2>
            <span className="text-xs text-muted-foreground">
              {courses.length} courses
            </span>
          </div>

          {courses.length === 0 ? (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No courses to analyze yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border/40 bg-muted/20">
                {[
                  {
                    key: "name" as SortKey,
                    label: "Course",
                    col: "col-span-4",
                  },
                  {
                    key: "questions" as SortKey,
                    label: "Questions",
                    col: "col-span-2 hidden sm:flex",
                  },
                  {
                    key: "completion" as SortKey,
                    label: "Completion",
                    col: "col-span-3",
                  },
                  {
                    key: "accuracy" as SortKey,
                    label: "Accuracy",
                    col: "col-span-2 hidden sm:flex",
                  },
                ].map(({ key, label, col }) => (
                  <button
                    key={key}
                    onClick={() => handleSort(key)}
                    className={cn(
                      "flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors",
                      col,
                    )}
                  >
                    {label}
                    <SortIcon k={key} />
                  </button>
                ))}
                <div className="col-span-1" />
              </div>

              {/* Table rows */}
              <div className="divide-y divide-border/30">
                {sortedCourses.map((course, i) => (
                  <div
                    key={course.id}
                    className="grid grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-muted/20 transition-colors duration-150 group"
                  >
                    {/* Course name */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-muted border border-border/60 text-[10px] font-semibold text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-colors">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate">
                        {course.name}
                      </span>
                    </div>

                    {/* Question count */}
                    <div className="col-span-2 hidden sm:flex items-center gap-1.5">
                      <FileQuestion className="h-3.5 w-3.5 text-muted-foreground/40" />
                      <span className="text-sm text-muted-foreground">
                        {course.answered}/{course.total}
                      </span>
                    </div>

                    {/* Completion bar */}
                    <div className="col-span-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {course.completion}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-700"
                          style={{ width: `${course.completion}%` }}
                        />
                      </div>
                    </div>

                    {/* Accuracy */}
                    <div className="col-span-2 hidden sm:flex flex-col gap-1">
                      <span className="text-xs font-semibold text-foreground">
                        {course.answered > 0 ? `${course.accuracy}%` : "—"}
                      </span>
                      {course.answered > 0 && (
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                            style={{ width: `${course.accuracy}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Mastery badge */}
                    <div className="col-span-1 flex justify-end">
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap hidden lg:inline-flex",
                          masteryColor(course.completion),
                        )}
                      >
                        {masteryLabel(course.completion)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 px-5 py-3 border-t border-border/40 bg-muted/10">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-6 bg-primary rounded-full" />
                  <span className="text-[10px] text-muted-foreground">
                    Completion
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-6 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] text-muted-foreground">
                    Accuracy
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
