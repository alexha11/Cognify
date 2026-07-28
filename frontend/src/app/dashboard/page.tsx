"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard, EmptyState } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { Course, AttemptStats } from "@/types";
import {
  BookOpen,
  FileQuestion,
  TrendingUp,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<AttemptStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user) return;

      try {
        const promises: Promise<any>[] = [apiGet<Course[]>("/courses")];

        if (user.role === "STUDENT") {
          promises.push(apiGet<AttemptStats>("/attempts/stats"));
        }

        const results = await Promise.all(promises);

        const coursesData = results[0];
        setCourses(
          Array.isArray(coursesData) ? coursesData : coursesData?.data || [],
        );

        if (user.role === "STUDENT" && results[1]) {
          setStats(results[1]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = user.role === "ADMIN";
  const isInstructor = user.role === "INSTRUCTOR";
  const isStudent = user.role === "STUDENT";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Navigation & Welcome */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-serif text-base">
              <span className="text-foreground font-semibold font-sans">
                {user.firstName} {user.lastName}
              </span>

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
            </div>
          )}
        </div>

        {/* Audit Metrics */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Courses"
            value={courses?.length || 0}
          />

          {(isAdmin || isInstructor) && (
            <StatCard
              icon={FileQuestion}
              label="Questions"
              value={courses.reduce(
                (acc, c) => acc + (c._count?.questions || 0),
                0,
              )}
            />
          )}

          {isStudent && (
            <>
              <Card className="relative group hover:bg-secondary/20 transition-all duration-300">
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
                      {stats ? stats.overall.total : "0"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <StatCard
                icon={TrendingUp}
                label="Accuracy"
                value={stats ? `${stats.overall.percentage}%` : "0%"}
                badge="Recall"
              />
            </>
          )}
        </div>

        {/* Course Exploration */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Your courses
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
            <EmptyState
              icon={BookOpen}
              message="No courses yet."
              action={
                isAdmin || isInstructor ? (
                  <Button asChild variant="pill">
                    <Link href="/courses">Create a course</Link>
                  </Button>
                ) : undefined
              }
            />
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
                          {course._count?.questions || 0} Questions
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
      </div>
    </DashboardLayout>
  );
}
