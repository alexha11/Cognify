"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { Course } from "@/types";
import { Loader2, FileQuestion, Play, ArrowRight } from "lucide-react";

export default function QuizDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (authLoading) return;
      try {
        const data = await apiGet<Course[]>("/courses");
        // Only include courses that have at least one question
        const validQuizzes = (data || []).filter(
          (course) => (course._count?.questions || 0) > 0
        );
        setQuizzes(validQuizzes);
      } catch (error) {
        console.error("Failed to fetch courses for quizzes", error);
        setQuizzes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, [authLoading, user]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Quizzes
          </h1>
          <p className="text-xl text-muted-foreground font-serif leading-relaxed max-w-3xl">
            Test your knowledge. Select a quiz below to begin a new session.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            message="No quizzes available."
            action={
              user?.role === "ADMIN" || user?.role === "INSTRUCTOR" ? (
                <Button asChild variant="pill">
                  <Link href="/courses">Create a course with questions</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="group flex flex-col hover:bg-card hover:border-primary/20 transition-all duration-300"
              >
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-md">
                      <FileQuestion className="h-3.5 w-3.5" />
                      {quiz._count?.questions} Questions
                    </span>
                  </div>
                  <CardTitle className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {quiz.name}
                  </CardTitle>
                  <p className="mt-3 text-sm text-muted-foreground font-serif line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {quiz.description || "No description provided."}
                  </p>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-0 mt-auto">
                  <div className="pt-6 border-t border-border/40">
                    <Link href={`/quiz/${quiz.id}`}>
                      <Button className="w-full rounded-xl gap-2 font-semibold shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        Start Quiz
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
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
