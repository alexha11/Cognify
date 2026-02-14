"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet, apiPost } from "@/lib/api";
import { Course } from "@/types";
import { useAuth } from "@/lib/auth";
import {
  Sparkles,
  Loader2,
  Check,
  BookOpen,
  Lock,
  ArrowRight,
} from "lucide-react";
import { FeatureGate } from "@/components/ui";

function AIGenerateContent() {
  const searchParams = useSearchParams();
  const preSelectedCourseId = searchParams.get("courseId");

  const { user, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(
    preSelectedCourseId || "",
  );
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    questionsCreated: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (authLoading || !user) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await apiGet<Course[]>("/courses?role=INSTRUCTOR");
        setCourses(data || []);
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [user, authLoading]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError("");
    setResult(null);

    try {
      const data = await apiPost<{ message: string; questionsCreated: number }>(
        "/ai/generate-questions",
        {
          courseId: selectedCourse,
          topic,
          count,
        },
      );
      setResult(data);
      setTopic("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to generate questions");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          AI Generation
        </h1>
        <p className="mt-2 text-muted-foreground font-serif text-lg leading-relaxed">
          Create high-quality exam questions in seconds.
        </p>
      </div>

      {!user ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="overflow-hidden bg-card">
            <div className="p-10 md:p-14 text-center space-y-10">
              <div className="max-w-md mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider">
                  <Lock className="h-3 w-3" />
                  Instructor Access
                </div>
                <h2 className="text-3xl font-semibold text-foreground tracking-tight leading-tight">
                  Harness the power of research.
                </h2>
                <p className="text-muted-foreground font-serif text-lg leading-relaxed">
                  Instantly generate assessments from any topic. Save hours of
                  pedagogical prep and build comprehensive courses for your
                  students.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  {
                    title: "Synthesize",
                    desc: "Generate 10 questions in under 30 seconds.",
                  },
                  {
                    title: "Universal",
                    desc: "From specialized research to survey topics.",
                  },
                  {
                    title: "Refined",
                    desc: "Professional-grade accuracy.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-background border border-border"
                  >
                    <h4 className="font-bold text-[10px] uppercase tracking-widest text-primary mb-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-serif">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <FeatureGate
                  variant="prompt"
                  title="Unlock AI Generation"
                  description="Instructors and Admins can use AI to generate questions directly into their courses."
                >
                  <Button size="xl" className="px-10" variant="pill">
                    Apply for instructor access
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </FeatureGate>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* Generation Form */}
          <Card>
            <CardHeader className="pb-8">
              <CardTitle className="text-xl font-semibold">
                Generate new material
              </CardTitle>
              <CardDescription className="font-serif">
                Select a course and enter a research topic to generate
                assessment items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-8">
                {error && (
                  <div className="rounded bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {result && (
                  <div className="rounded border border-green-500/20 bg-green-500/5 p-4">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-700">
                          {result.message}
                        </p>
                        <p className="text-sm text-green-600 font-serif">
                          The questions are pending pedagogical review.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="course">Select course</Label>
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading course...
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
                      <BookOpen className="h-4 w-4" />
                      No courses found. Create a course first.
                    </div>
                  ) : (
                    <select
                      id="course"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="flex h-12 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                      required
                    >
                      <option value="">Select a course...</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="topic">Research topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Quantum Computing fundamentals, React Hooks, etc."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Be specific for higher quality output.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="count">Quantity</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={10}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    required
                  />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Maximum 10 items per synthesis request.
                  </p>
                </div>

                <Button
                  type="submit"
                  size="xl"
                  className="w-full"
                  disabled={isGenerating || !selectedCourse || !topic}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate {count} questions
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-primary/5 border-0 shadow-none">
            <CardContent className="pt-8 pb-8 px-8">
              <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Workflow guidelines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    title: "Identify",
                    desc: "Select the target course module.",
                  },
                  {
                    step: "02",
                    title: "Define",
                    desc: "Specify the scientific or technical theme.",
                  },
                  {
                    step: "03",
                    title: "Verify",
                    desc: "Review and approve generated items.",
                  },
                ].map((s, i) => (
                  <div key={i} className="space-y-2">
                    <div className="text-[10px] font-bold text-primary tracking-widest">
                      {s.step}
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">
                      {s.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-serif">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function AIGeneratePage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <AIGenerateContent />
      </Suspense>
    </DashboardLayout>
  );
}
