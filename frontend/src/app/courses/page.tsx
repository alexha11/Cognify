"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Course } from "@/types";
import { formatDate } from "@/lib/utils";
import { Plus, BookOpen, FileQuestion, Loader2, X, Play, Globe, Lock } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function CoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const c = t.courses;
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: "", description: "", isPublic: false });

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

    try {
      await apiPost("/courses", newCourse);
      setNewCourse({ name: "", description: "", isPublic: false });
      setShowCreate(false);
      await fetchCourses();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        error.response?.data?.message || "Failed to create course";
      showToast(errorMessage, "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {c.title}
            </h1>
            <p className="text-muted-foreground font-serif">
              {canCreate ? c.manageCourses : c.exploreCourses}
            </p>
          </div>
          {canCreate && !showCreate && (
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="h-4 w-4" />
              {c.newCourse}
            </Button>
          )}
        </div>

        {/* Create Course Section */}
        {showCreate && (
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">{c.createNewCourse}</CardTitle>
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
                <div className="space-y-3">
                  <Label htmlFor="name">{c.courseName}</Label>
                  <Input
                    id="name"
                    placeholder={c.nameplaceholder}
                    value={newCourse.name}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="description">{c.description}</Label>
                  <Input
                    id="description"
                    placeholder={c.descPlaceholder}
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                {/* isPublic toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.visibility}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {newCourse.isPublic ? c.publicDesc : c.privateDesc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewCourse({ ...newCourse, isPublic: !newCourse.isPublic })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      newCourse.isPublic ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        newCourse.isPublic ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={creating} size="lg">
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {c.creating}
                      </>
                    ) : (
                      c.createCourse
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => setShowCreate(false)}
                  >
                    {c.cancel}
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
          <EmptyState
            icon={BookOpen}
            message={
              canCreate
                ? c.noCoursesInstructor
                : c.noCoursesStudent
            }
            action={
              canCreate ? (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4" />
                  {c.createCourse}
                </Button>
              ) : undefined
            }
          />
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
                      variant={course.isPublic ? "success" : "secondary"}
                    >
                      {course.isPublic ? c.public : c.private}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Link href={`/courses/${course.id}`}>
                    <p className="text-base text-muted-foreground font-serif line-clamp-2 min-h-[3rem] leading-relaxed">
                      {course.description || t.common.noDescription}
                    </p>
                  </Link>
                  <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      <FileQuestion className="h-3.5 w-3.5" />
                      {course._count.questions} {c.questions}
                    </span>
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5" />
                      {course._count.materials} {c.materials}
                    </span>
                  </div>

                  {/* Start Quiz Button */}
                  <Link href={`/quiz/${course.id}`} className="block">
                    <Button variant="pill" size="lg" className="w-full">
                      <Play className="h-4 w-4 text-xs" />
                      {c.startQuiz}
                    </Button>
                  </Link>

                  <div className="pt-4 border-t border-border">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {c.created} {formatDate(course.createdAt)}
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
