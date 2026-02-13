"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Check,
  X,
  HelpCircle,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Filter,
} from "lucide-react";

interface Answer {
  id?: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  content: string;
  hint?: string;
  courseId: string;
  answers: Answer[];
  approved: boolean;
  aiGenerated: boolean;
}

interface Course {
  id: string;
  name: string;
}

export default function QuestionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    content: "",
    hint: "",
  });
  const [newAnswers, setNewAnswers] = useState<Answer[]>([
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
  ]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const canManage = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  // Fetch courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      if (authLoading || !user) return;
      try {
        const data = await apiGet<Course[]>("/courses");
        setCourses(data || []);
        if (data && data.length > 0) {
          setSelectedCourse(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [authLoading, user]);

  // Fetch questions when course changes
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedCourse) return;
      try {
        setIsLoading(true);
        const data = await apiGet<Question[]>(
          `/questions/course/${selectedCourse}`,
        );
        setQuestions(data || []);
      } catch (error) {
        console.error("Failed to fetch questions", error);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [selectedCourse]);

  const addAnswer = () => {
    if (newAnswers.length < 6) {
      setNewAnswers([...newAnswers, { content: "", isCorrect: false }]);
    }
  };

  const removeAnswer = (index: number) => {
    if (newAnswers.length > 2) {
      const updated = newAnswers.filter((_, i) => i !== index);
      // Ensure at least one answer is correct
      if (!updated.some((a) => a.isCorrect) && updated.length > 0) {
        updated[0].isCorrect = true;
      }
      setNewAnswers(updated);
    }
  };

  const updateAnswer = (
    index: number,
    field: keyof Answer,
    value: string | boolean,
  ) => {
    const updated = [...newAnswers];
    if (field === "isCorrect" && value === true) {
      // Only one correct answer
      updated.forEach((a, i) => {
        a.isCorrect = i === index;
      });
    } else if (field === "content") {
      updated[index].content = value as string;
    } else if (field === "isCorrect") {
      updated[index].isCorrect = value as boolean;
    }
    setNewAnswers(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }

    // Validation
    if (newQuestion.content.length < 10) {
      setError("Question must be at least 10 characters");
      return;
    }
    if (!newAnswers.some((a) => a.isCorrect)) {
      setError("Please mark one answer as correct");
      return;
    }
    if (newAnswers.some((a) => !a.content.trim())) {
      setError("All answers must have content");
      return;
    }

    setCreating(true);
    setError("");

    try {
      await apiPost("/questions", {
        content: newQuestion.content,
        hint: newQuestion.hint || undefined,
        courseId: selectedCourse,
        answers: newAnswers,
      });

      // Reset form
      setNewQuestion({ content: "", hint: "" });
      setNewAnswers([
        { content: "", isCorrect: true },
        { content: "", isCorrect: false },
      ]);
      setShowCreate(false);

      // Refresh questions
      const data = await apiGet<Question[]>(
        `/questions/course/${selectedCourse}`,
      );
      setQuestions(data || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to create question");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await apiDelete(`/questions/${questionId}`);
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error("Failed to delete question", err);
    }
  };

  if (!isMounted) return null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              Question Bank
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
              Manage and review questions for your courses.
            </p>
          </div>
          {canManage && (
            <Button
              onClick={() => setShowCreate(true)}
              variant="pill"
              size="xl"
              className="md:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add question
            </Button>
          )}
        </div>

        {/* Filters/Selectors */}
        <Card className="bg-card">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary shrink-0">
                <Filter className="h-5 w-5" />
              </div>
              <div className="flex-1 w-full space-y-2">
                <Label
                  htmlFor="courseKey"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Select course
                </Label>
                <select
                  id="courseKey"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 font-serif"
                >
                  <option value="">All courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : questions.length === 0 ? (
          <Card className="border-dashed py-20 bg-transparent">
            <CardContent className="text-center space-y-8">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-secondary text-muted-foreground/40">
                <HelpCircle className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight">
                  No questions yet
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {selectedCourse
                    ? "Add your first question to get started."
                    : "Select a course above to see its questions."}
                </p>
              </div>
              {canManage && selectedCourse && (
                <Button
                  onClick={() => setShowCreate(true)}
                  variant="outline"
                  size="lg"
                >
                  Add question
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {questions.length} questions
              </span>
            </div>
            {questions.map((question, index) => (
              <Card
                key={question.id}
                className="group hover:border-primary/20 transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between gap-6">
                    <div className="space-y-6 flex-1">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                          ID: Q{String(index + 1).padStart(3, "0")}
                        </span>
                        {question.aiGenerated && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase tracking-widest bg-primary/5 text-primary border-primary/20"
                          >
                            AI Generated
                          </Badge>
                        )}
                        {!question.approved && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase tracking-widest bg-secondary text-muted-foreground border-border"
                          >
                            Pending review
                          </Badge>
                        )}
                      </div>
                      <p className="text-xl font-semibold text-foreground tracking-tight leading-relaxed font-serif italic pr-8">
                        "{question.content}"
                      </p>
                      {question.hint && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/40 border border-border/40">
                          <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground font-serif leading-relaxed italic">
                            {question.hint}
                          </p>
                        </div>
                      )}
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(question.id)}
                        className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5"
                        title="Delete question"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  {/* Answers */}
                  <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.answers.map((answer, i) => (
                      <div
                        key={answer.id || i}
                        className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                          answer.isCorrect
                            ? "bg-primary/5 border-primary/20 text-foreground"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        <div
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            answer.isCorrect
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border text-muted-foreground/20"
                          }`}
                        >
                          {answer.isCorrect ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                          )}
                        </div>
                        <span className="text-base font-serif leading-relaxed">
                          {answer.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Question Modal - Redesigned as Overlay */}
        {showCreate && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <Card className="max-w-3xl w-full shadow-2xl bg-card animate-in fade-in zoom-in-95 duration-300">
              <CardHeader className="p-10 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-semibold tracking-tight">
                      Create question
                    </CardTitle>
                    <CardDescription>
                      Add a new question for this course.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCreate(false)}
                    className="hover:bg-secondary rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </CardHeader>
              <form onSubmit={handleCreate}>
                <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {error && (
                    <div className="p-4 bg-destructive/5 border border-destructive/20 text-destructive rounded-xl text-sm font-serif italic">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <Label
                      htmlFor="questionContent"
                      className="text-[10px] font-bold uppercase tracking-widest"
                    >
                      Question
                    </Label>
                    <textarea
                      id="questionContent"
                      value={newQuestion.content}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          content: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-5 py-4 border border-border rounded-2xl bg-background text-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 font-serif text-lg italic"
                      placeholder="Enter your question..."
                      required
                      minLength={10}
                    />
                    <div className="flex justify-end pr-2">
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {newQuestion.content.length} characters
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label
                      htmlFor="hintContent"
                      className="text-[10px] font-bold uppercase tracking-widest"
                    >
                      Hint (optional)
                    </Label>
                    <Input
                      id="hintContent"
                      value={newQuestion.hint}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, hint: e.target.value })
                      }
                      className="font-serif italic text-base px-5 py-6 rounded-xl"
                      placeholder="Add a hint for students..."
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Answer options
                      </Label>
                      {newAnswers.length < 6 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={addAnswer}
                          className="text-[10px] font-bold uppercase tracking-widest text-primary"
                        >
                          + Add option
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {newAnswers.map((answer, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant={answer.isCorrect ? "default" : "ghost"}
                            size="icon"
                            onClick={() =>
                              updateAnswer(index, "isCorrect", true)
                            }
                            className={cn(
                              "h-10 w-10 shrink-0 rounded-xl transition-all duration-300",
                              answer.isCorrect
                                ? "shadow-lg shadow-primary/20"
                                : "text-muted-foreground/20 hover:border-primary/40",
                            )}
                            title="Mark as correct"
                          >
                            <Check className="w-5 h-5" />
                          </Button>
                          <Input
                            value={answer.content}
                            onChange={(e) =>
                              updateAnswer(index, "content", e.target.value)
                            }
                            className="flex-1 font-serif text-base px-5 py-6 rounded-xl"
                            placeholder={`Option ${index + 1}...`}
                            required
                          />
                          {newAnswers.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAnswer(index)}
                              className="text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-10 border-t border-border/40 bg-secondary/10 flex justify-end gap-6 rounded-b-[32px]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreate(false)}
                    className="font-bold text-[10px] uppercase tracking-widest"
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    variant="pill"
                    size="xl"
                    className="px-10"
                  >
                    {creating ? "Saving..." : "Save question"}
                    {!creating && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
