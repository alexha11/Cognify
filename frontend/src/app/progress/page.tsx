"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { AttemptStats, Attempt, Course, CourseProgress } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { ProgressTeaser } from "@/components/ui";
import {
  BarChart3,
  TrendingUp,
  Check,
  X,
  BookOpen,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function ProgressPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AttemptStats | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<
    Record<string, CourseProgress>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const [statsData, attemptsData, coursesData] = await Promise.all([
          apiGet<AttemptStats>("/attempts/stats"),
          apiGet<Attempt[]>("/attempts/me"),
          apiGet<Course[]>("/courses"),
        ]);

        setStats(statsData);
        setAttempts(attemptsData || []);
        setCourses(coursesData || []);

        // Fetch progress for each course
        const progressMap: Record<string, CourseProgress> = {};
        const courses = coursesData || [];
        for (const course of courses) {
          try {
            const progressData = await apiGet<CourseProgress>(
              `/attempts/course/${course.id}`,
            );
            progressMap[course.id] = progressData;
          } catch {
            // Course may not have progress yet
          }
        }
        setCourseProgress(progressMap);
      } catch (error) {
        console.error("Failed to fetch progress", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Learning Progress
          </h1>
          <p className="mt-2 text-muted-foreground font-serif text-lg leading-relaxed">
            Monitor your intellectual trajectory and master your courses.
          </p>
        </div>

        {!user ? (
          <ProgressTeaser />
        ) : (
          <>
            {/* Overall Stats */}
            {stats && (
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    label: "Synthesis Volume",
                    value: stats.overall.total,
                    icon: BarChart3,
                    desc: "Total items processed",
                  },
                  {
                    label: "Accuracy Threshold",
                    value: `${stats.overall.percentage}%`,
                    icon: TrendingUp,
                    desc: "Precision of your assessments",
                  },
                  {
                    label: "Successful Identifications",
                    value: stats.overall.correct,
                    icon: Check,
                    desc: "Verifiable correct responses",
                  },
                ].map((item, i) => (
                  <Card
                    key={i}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                          <item.icon className="h-5 w-5" />
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
                          {item.label}
                        </p>
                        <p className="text-4xl font-semibold text-foreground tracking-tighter">
                          {item.value}
                        </p>
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground font-serif italic">
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Course Progress */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold tracking-tight">
                Course Mastery
              </h2>
              {courses.length === 0 ? (
                <Card className="border-dashed py-16">
                  <CardContent className="text-center space-y-4">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-serif">
                      No courses identified in your profile yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {courses.map((course) => {
                    const progress = courseProgress[course.id];
                    const percentage = progress?.percentage || 0;

                    return (
                      <Card
                        key={course.id}
                        className="group hover:bg-secondary/10 transition-colors duration-300"
                      >
                        <CardContent className="p-8">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-xl tracking-tight leading-none">
                                {course.name}
                              </h3>
                              <p className="text-sm text-muted-foreground font-serif">
                                {progress?.answered || 0} /{" "}
                                {progress?.totalQuestions || 0} units validated
                              </p>
                            </div>
                            <Badge
                              variant={
                                percentage === 100 ? "default" : "secondary"
                              }
                              className="px-4 py-1.5 h-fit self-start"
                            >
                              {percentage}% Mastery
                            </Badge>
                          </div>

                          <div className="space-y-4">
                            <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-1000 ease-out"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                              <span className="text-muted-foreground">
                                Progression
                              </span>
                              <span className="text-primary">
                                {percentage}% Complete
                              </span>
                            </div>
                          </div>

                          {progress && progress.remaining > 0 && (
                            <div className="mt-8 pt-8 border-t border-border/40 flex justify-end">
                              <Button asChild variant="pill" size="lg">
                                <Link href={`/quiz/${course.id}`}>
                                  Resume session
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Recent Attempts */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold tracking-tight">
                Recent Activity
              </h2>
              {attempts.length === 0 ? (
                <Card className="border-0 bg-secondary/20">
                  <CardContent className="py-12 text-center space-y-6">
                    <p className="text-muted-foreground font-serif italic text-lg">
                      No recent activity found in your learning logs.
                    </p>
                    <Link href="/courses">
                      <Button variant="pill" size="xl">
                        Identify courses
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {(attempts || []).slice(0, 10).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center gap-6 p-5 rounded-2xl border border-border/40 hover:bg-card transition-all duration-300"
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          attempt.isCorrect
                            ? "bg-primary/5 text-primary"
                            : "bg-destructive/5 text-destructive"
                        }`}
                      >
                        {attempt.isCorrect ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <X className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate text-lg">
                          {attempt.question.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase tracking-widest"
                          >
                            {attempt.isCorrect ? "Validated" : "Incorrect"}
                          </Badge>
                          <p className="text-xs text-muted-foreground font-serif italic">
                            {formatDate(attempt.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
