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

        // results[0] is always courses
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
      <div className="space-y-10">
        {/* Header */}
        {!user ? (
          <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-8 md:p-12 text-white shadow-2xl">
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                Master Any Subject with AI-Powered Learning
              </h1>
              <p className="text-lg text-indigo-100 mb-8 max-w-lg">
                Generates personalized quizzes, tracks your progress, and helps
                you learn faster with state-of-the-art AI.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold h-14 px-8 rounded-xl shadow-lg shadow-indigo-900/20"
                >
                  <Link href="/register">Start Learning Free</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-indigo-300 text-white hover:bg-indigo-500 font-bold h-14 px-8 rounded-xl backdrop-blur-sm"
                >
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
            <Sparkles className="absolute right-12 bottom-12 h-32 w-32 text-indigo-400 opacity-20 rotate-12" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.firstName}!
              </h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {user.organizationName} • {user.role.toLowerCase()}
              </p>
            </div>
            {(isAdmin || isInstructor) && (
              <div className="flex gap-3">
                <Link href="/courses">
                  <Button variant="outline">
                    <Plus className="h-4 w-4" />
                    New Course
                  </Button>
                </Link>
                <Link href="/ai-generate">
                  <Button>
                    <Sparkles className="h-4 w-4" />
                    Generate Questions
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Courses
                  </p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                    {organization?.courseCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(isAdmin || isInstructor) && (
            <>
              <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30">
                      <FileQuestion className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Questions
                      </p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                        {courses.reduce(
                          (acc, c) => acc + (c._count?.questions || 0),
                          0,
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Team
                      </p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                        {organization?.userCount || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {(isStudent || !user) && (
            <>
              <Card className="border-0 shadow-sm transition-shadow hover:shadow-md relative overflow-hidden group">
                {!user && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Answered
                      </p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                        {user && stats ? stats.overall.total : "128"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm transition-shadow hover:shadow-md relative overflow-hidden group">
                {!user && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Accuracy
                      </p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                        {user && stats ? `${stats.overall.percentage}%` : "92%"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isAdmin && organization && (
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Active Plan
                    </p>
                    <div className="mt-1">
                      <Badge
                        variant={
                          organization.plan === "FREE" ? "secondary" : "default"
                        }
                        className="font-bold"
                      >
                        {organization.plan}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Courses */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {isStudent ? "Explore Courses" : "Your Courses"}
            </h2>
            <Link href="/courses">
              <Button
                variant="ghost"
                size="sm"
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className="animate-pulse border-0 shadow-sm h-48"
                />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 dark:border-gray-800 bg-transparent">
              <CardContent className="py-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500 font-medium text-lg">
                  No courses available yet
                </p>
                {(isAdmin || isInstructor) && (
                  <Button asChild className="mt-6 bg-indigo-600">
                    <Link href="/courses">Create Your First Course</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(courses || []).slice(0, 6).map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="group h-full border-0 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
                    <CardHeader>
                      <CardTitle className="group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {course.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                        {course.description ||
                          "No description provided for this course."}
                      </p>
                      <div className="mt-6 flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5">
                          <FileQuestion className="h-3.5 w-3.5" />
                          {course._count?.questions || 0} Questions
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" />
                          {course._count?.materials || 0} Materials
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {!user && (
          <section className="rounded-3xl bg-gradient-to-br from-gray-900 to-indigo-950 p-10 md:p-16 text-center text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <Badge className="mb-6 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-4 py-1.5 text-xs font-black uppercase tracking-widest">
                Unlock Full Potential
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                Ready to transform your study routine?
              </h2>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                Join thousands of students and instructors using Cognify to save
                time, track progress, and achieve academic excellence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <FeatureGate
                  variant="prompt"
                  title="Full Access"
                  description="Create your free account today to unlock personalized quizzes and progress tracking."
                >
                  <Button
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold h-14 px-10 rounded-xl shadow-xl shadow-indigo-900/40 w-full sm:w-auto"
                  >
                    Join Cognify for Free
                  </Button>
                </FeatureGate>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent" />
            <div className="absolute bottom-0 left-0 h-full w-1/3 bg-gradient-to-r from-purple-500/5 to-transparent" />
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
