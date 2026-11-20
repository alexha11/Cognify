"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageLoader } from "@/components/ui/page-loader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import { Course, AttemptStats } from "@/types";
import {
  BookOpen,
  FileQuestion,
  ListChecks,
  Target,
  ArrowRight,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const d = t.dashboard;

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
        const [coursesData, statsData] = await Promise.all([
          apiGet<Course[]>("/courses"),
          user.role === "STUDENT"
            ? apiGet<AttemptStats>("/attempts/stats")
            : Promise.resolve(null),
        ]);

        setCourses(Array.isArray(coursesData) ? coursesData : []);
        if (statsData) {
          setStats(statsData);
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
        <PageLoader />
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
              {d.title}
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground text-base">
              <span className="text-foreground font-semibold font-sans">
                {user.firstName} {user.lastName}
              </span>

              <span className="opacity-40">•</span>
              <Badge
                variant="outline"
                className="text-xs font-medium uppercase tracking-wide bg-primary/5"
              >
                {user.role}
              </Badge>
            </div>
          </div>
          {(isAdmin || isInstructor) && (
            <div className="flex gap-4">
              <Button asChild pill size="lg">
                <Link href="/courses">
                  <Plus className="h-5 w-5 mr-1" />
                  {d.newCourse}
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Metrics. All three are StatCards: the middle one used to be
            hand-built, with its own padding (its icon touched the card's top
            border), label style and number size. Two columns on phones and
            three from md, so a row is never three-quarters empty. */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
          <StatCard
            icon={BookOpen}
            label={d.courses}
            value={courses?.length || 0}
          />

          {(isAdmin || isInstructor) && (
            <StatCard
              icon={FileQuestion}
              label={d.questions}
              value={courses.reduce(
                (acc, c) => acc + (c._count?.questions || 0),
                0,
              )}
            />
          )}

          {isStudent && (
            <>
              <StatCard
                icon={ListChecks}
                label={d.questionsAnswered}
                value={stats ? stats.overall.total : 0}
              />
              <StatCard
                icon={Target}
                label={d.accuracy}
                value={stats ? `${stats.overall.percentage}%` : "0%"}
              />
            </>
          )}
        </div>

        {/* Course Exploration */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              {d.yourCourses}
            </h2>
            <Button
              asChild
              variant="link"
              className="text-primary text-xs font-medium uppercase tracking-wide p-0 h-auto hover:opacity-70 transition-opacity"
            >
              <Link href="/courses">
                {d.viewAll}
                <ArrowRight className="h-3 w-3 ml-2" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-secondary/50 rounded-xl h-64"
                />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              message={d.noCourses}
              action={
                isAdmin || isInstructor ? (
                  <Button asChild pill>
                    <Link href="/courses">{d.createCourse}</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(courses || []).slice(0, 6).map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="group h-full hover:bg-card hover:border-primary/20 transition-all duration-300 flex flex-col">
                    <CardHeader className="p-6 sm:p-8">
                      <div className="space-y-3">
                        <CardTitle className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                          {course.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed min-h-[4.5rem]">
                          {course.description || d.noDescription}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0 mt-auto sm:px-8 sm:pb-8">
                      {/* Same words as the courses page ("materials", not "assets"). */}
                      <div className="pt-6 border-t border-border/40 flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        <span className="flex items-center gap-2">
                          <FileQuestion className="h-3.5 w-3.5 opacity-40" />
                          {course._count?.questions || 0} {t.courses.questions}
                        </span>
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 opacity-40" />
                          {course._count?.materials || 0} {t.courses.materials}
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
