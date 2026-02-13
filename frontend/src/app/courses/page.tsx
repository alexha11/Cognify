"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Course } from "@/types";
import { formatDate } from "@/lib/utils";
import { Plus, BookOpen, FileQuestion, Loader2, X, Play } from "lucide-react";

export default function CoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const canCreate = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  const fetchCourses = async () => {
    if (authLoading) return;
    try {
      const data = await apiGet<Course[]>("/courses");
      setCourses(data || []);
    } catch (error) {
      console.error("Failed to fetch courses", error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [authLoading, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      console.log("[Courses] Creating course:", newCourse);
      const result = await apiPost("/courses", newCourse);
      console.log("[Courses] Course created:", result);
      setNewCourse({ name: "", description: "" });
      setShowCreate(false);
      await fetchCourses();
    } catch (err: unknown) {
      console.error("[Courses] Creation failed:", err);
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        error.response?.data?.message || "Failed to create course";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setCreating(false);
    }
  };

  if (!isMounted) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Courses
            </h1>
            <p className="text-muted-foreground font-serif">
              {canCreate
                ? "Manage your curriculum"
                : "Explore available pathways"}
            </p>
          </div>
          {canCreate && !showCreate && (
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="h-4 w-4" />
              New Course
            </Button>
          )}
        </div>

        {/* Create Course Section */}
        {showCreate && (
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Create new course</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreate(false)}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-6 max-w-2xl">
                {error && (
                  <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-3">
                  <Label htmlFor="name">Course name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Foundations of AI"
                    value={newCourse.name}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="A brief overview of the course content..."
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={creating} size="lg">
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create course"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-16 w-16 text-muted/30 mb-6">
              <BookOpen className="h-full w-full" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              No courses found.
            </h3>
            <p className="mt-2 text-muted-foreground font-serif">
              {canCreate
                ? "Begin by creating your first educational pathway."
                : "Check back later for newly published courses."}
            </p>
            {canCreate && (
              <Button className="mt-8" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                Create course
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 pb-12">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="group h-full hover:bg-secondary/50 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/courses/${course.id}`} className="flex-1">
                      <CardTitle className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors">
                        {course.name}
                      </CardTitle>
                    </Link>
                    <Badge
                      variant={course.isPublished ? "success" : "secondary"}
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Link href={`/courses/${course.id}`}>
                    <p className="text-base text-muted-foreground font-serif line-clamp-2 min-h-[3rem] leading-relaxed">
                      {course.description || "No description yet."}
                    </p>
                  </Link>
                  <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      <FileQuestion className="h-3.5 w-3.5" />
                      {course._count.questions} questions
                    </span>
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5" />
                      {course._count.materials} materials
                    </span>
                  </div>

                  {/* Start Quiz Button */}
                  <Link href={`/quiz/${course.id}`} className="block">
                    <Button variant="pill" size="lg" className="w-full">
                      <Play className="h-4 w-4 text-xs" />
                      Take assessment
                    </Button>
                  </Link>

                  <div className="pt-4 border-t border-border">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Created {formatDate(course.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
