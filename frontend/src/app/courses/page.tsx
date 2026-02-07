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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Courses
            </h1>
            <p className="mt-1 text-gray-500">
              {canCreate ? "Manage your courses" : "Browse available courses"}
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New Course
            </Button>
          )}
        </div>

        {/* Create Course Modal */}
        {showCreate && (
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create New Course</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreate(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name</Label>
                  <Input
                    id="name"
                    placeholder="Introduction to Machine Learning"
                    value={newCourse.name}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Learn the fundamentals of ML..."
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Course"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
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
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No courses yet
            </h3>
            <p className="mt-2 text-gray-500">
              {canCreate
                ? "Create your first course to get started."
                : "No courses are available yet."}
            </p>
            {canCreate && (
              <Button className="mt-6" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                Create Course
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="group h-full transition-all hover:border-indigo-200 hover:shadow-xl dark:hover:border-indigo-800"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Link href={`/courses/${course.id}`} className="flex-1">
                      <CardTitle className="group-hover:text-indigo-600 cursor-pointer">
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
                <CardContent className="space-y-4">
                  <Link href={`/courses/${course.id}`}>
                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-gray-700">
                      {course.description || "No description"}
                    </p>
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="h-4 w-4" />
                      {course._count.questions} questions
                    </span>
                    <span>{course._count.materials} materials</span>
                  </div>

                  {/* Start Quiz Button */}
                  <Link href={`/quiz/${course.id}`} className="block">
                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold"
                      size="lg"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Quiz
                    </Button>
                  </Link>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400">
                      Created {formatDate(course.createdAt)} by{" "}
                      {course.createdBy.firstName}
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
