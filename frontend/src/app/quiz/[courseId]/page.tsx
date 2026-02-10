"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Question, AttemptResult, CourseProgress } from "@/types";
import { AuthPromptModal } from "@/components/ui/auth-prompt-modal";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  X,
  Lightbulb,
  ArrowRight,
  Trophy,
  Loader2,
  Sparkles,
  Search,
  RefreshCw,
} from "lucide-react";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { user, isLoading: authLoading } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [completed, setCompleted] = useState(false);
  const [demoStats, setDemoStats] = useState({ correct: 0, total: 0 });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDemoMode = !authLoading && !user;

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;

      try {
        const allQuestions = await apiGet<Question[]>(
          `/questions/course/${courseId}`,
        );

        if (isDemoMode) {
          // In demo mode, just take first 3 questions
          setQuestions((allQuestions || []).slice(0, 3));
        } else {
          // For auth users, get progress and filter answered
          const [progressData, attemptsData] = await Promise.all([
            apiGet<CourseProgress>(`/attempts/course/${courseId}`),
            apiGet<{ question: Question }[]>("/attempts/me"),
          ]);

          const attemptedIds = new Set<string>();
          (attemptsData || []).forEach((a) => {
            if (a.question) attemptedIds.add(a.question.id);
          });

          const unanswered = (allQuestions || []).filter(
            (q) => !attemptedIds.has(q.id),
          );
          setQuestions(unanswered);
          setProgress(progressData);

          if (unanswered.length === 0) {
            setCompleted(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch questions", error);
        router.push("/courses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId, router, authLoading, isDemoMode]);

  const currentQuestion = questions[currentIndex];

  const handleSubmit = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    if (isDemoMode) {
      // Simulate result for guest
      const selected = currentQuestion.answers.find(
        (a) => a.id === selectedAnswer,
      );
      const guestResult = {
        isCorrect: selected?.isCorrect || false,
        selectedAnswer: selected!,
        hint: currentQuestion.hint,
      };
      setResult(guestResult as AttemptResult);
      setDemoStats((prev) => ({
        correct: prev.correct + (guestResult.isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    } else {
      setIsSubmitting(true);
      try {
        const data = await apiPost<AttemptResult>("/attempts", {
          questionId: currentQuestion.id,
          selectedAnswerId: selectedAnswer,
        });
        setResult(data);
      } catch (error) {
        console.error("Failed to submit answer", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setResult(null);
    } else {
      setCompleted(true);
    }
  };

  const handleRetry = async () => {
    // Reset all quiz state
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setResult(null);
    setCompleted(false);
    setDemoStats({ correct: 0, total: 0 });
    setIsLoading(true);

    try {
      // Re-fetch all questions
      const allQuestions = await apiGet<Question[]>(
        `/questions/course/${courseId}`,
      );
      setQuestions(allQuestions || []);
    } catch (error) {
      console.error("Failed to fetch questions", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (completed) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-16 text-center">
          <div className="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-primary">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {isDemoMode ? "Preview complete." : "Assessment complete."}
          </h1>
          <p className="mt-4 text-muted-foreground font-serif text-lg leading-relaxed">
            {isDemoMode
              ? "You've finished the guest preview. Create an account to unlock the full curriculum and track your mastery."
              : "You've answered all available questions for this course."}
          </p>

          {(progress || isDemoMode) && (
            <div className="mt-12 p-10 bg-card rounded-[32px] border border-border relative overflow-hidden">
              {isDemoMode && (
                <div className="absolute top-0 right-0 p-4">
                  <Badge variant="secondary">GUEST MODE</Badge>
                </div>
              )}
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Overall Score
              </p>
              <p className="text-6xl font-semibold text-primary mt-4 tracking-tighter">
                {isDemoMode
                  ? `${Math.round((demoStats.correct / demoStats.total) * 100)}%`
                  : `${progress?.percentage}%`}
              </p>
              <p className="text-muted-foreground mt-6 font-serif text-lg italic">
                {isDemoMode
                  ? `${demoStats.correct} out of ${demoStats.total} correct`
                  : `${progress?.correct} out of ${progress?.totalQuestions} correct`}
              </p>
            </div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            {isDemoMode ? (
              <>
                <Button
                  size="lg"
                  className="px-8 bg-indigo-600 hover:bg-indigo-700 font-bold"
                  onClick={() => setShowAuthModal(true)}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Save Progress & Continue
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 font-semibold"
                  onClick={handleRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Quiz
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="px-8 font-bold"
                  onClick={handleRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Quiz
                </Button>
                <Link href="/progress">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 font-semibold"
                  >
                    View Progress
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="px-8 font-semibold"
                  >
                    Back to Courses
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        <AuthPromptModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="Don't Lose Your Progress!"
          description={`You just answered ${demoStats.correct} questions correctly! Create a free account now to save your results and continue mastering this course.`}
        />
      </DashboardLayout>
    );
  }

  if (!currentQuestion) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No questions available</p>
          <Link href="/courses">
            <Button className="mt-4">Back to Courses</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-10 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>
          <Badge variant="outline">
            Question {currentIndex + 1} of {questions.length}
          </Badge>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            <span>Assessment progression</span>
            <span className="text-primary/80">
              {Math.round(
                ((currentIndex + (result ? 1 : 0)) / questions.length) * 100,
              )}
              % Complete
            </span>
          </div>
          <div className="h-1.5 bg-secondary/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out"
              style={{
                width: `${((currentIndex + (result ? 1 : 0)) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question & Interaction Unit */}
        <Card className="bg-card overflow-hidden">
          <CardHeader className="p-10 pb-6">
            <div className="space-y-8">
              <div className="flex items-start justify-between gap-6">
                <CardTitle className="text-2xl md:text-3xl font-semibold leading-[1.3] tracking-tight font-serif italic text-foreground">
                  "{currentQuestion.content}"
                </CardTitle>
              </div>
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const query = encodeURIComponent(currentQuestion.content);
                    window.open(
                      `https://www.google.com/search?q=${query}`,
                      "_blank",
                    );
                  }}
                  className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-primary"
                >
                  <Search className="h-3.5 w-3.5" />
                  Technical Analysis
                </Button>
                <div className="h-4 w-[1px] bg-border/40" />
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-border/60"
                >
                  Question ID: Q{String(currentIndex + 1).padStart(3, "0")}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-4 space-y-4">
            <div className="grid gap-4">
              {currentQuestion.answers.map((answer, index) => {
                const letter = String.fromCharCode(65 + index);
                const isSelected = selectedAnswer === answer.id;
                const showResult = result !== null;
                const isCorrect = answer.isCorrect;
                const wasSelected = result?.selectedAnswer.id === answer.id;

                let stateClasses =
                  "bg-background border-border hover:border-primary/40";

                if (showResult) {
                  if (isCorrect) {
                    stateClasses =
                      "bg-green-500/5 border-green-500/40 text-green-700 shadow-[0_0_20px_rgba(34,197,94,0.05)]";
                  } else if (wasSelected && !isCorrect) {
                    stateClasses =
                      "bg-destructive/5 border-destructive/40 text-destructive";
                  } else {
                    stateClasses =
                      "bg-background/40 border-border/40 opacity-50";
                  }
                } else if (isSelected) {
                  stateClasses =
                    "bg-primary/5 border-primary shadow-[0_0_20px_rgba(0,0,0,0.05)]";
                }

                return (
                  <Button
                    key={answer.id}
                    variant="ghost"
                    onClick={() => !result && setSelectedAnswer(answer.id)}
                    disabled={!!result}
                    className={cn(
                      "group w-full h-auto text-left p-6 rounded-2xl border transition-all duration-300",
                      stateClasses,
                    )}
                  >
                    <div className="flex items-center gap-5 w-full">
                      <span
                        className={cn(
                          "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all duration-300",
                          isSelected ||
                            (showResult && (isCorrect || wasSelected))
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                        )}
                      >
                        {showResult && isCorrect ? (
                          <Check className="h-5 w-5" />
                        ) : showResult && wasSelected && !isCorrect ? (
                          <X className="h-5 w-5" />
                        ) : (
                          letter
                        )}
                      </span>
                      <span className="text-lg font-serif leading-relaxed flex-1">
                        {answer.content}
                      </span>
                      {showResult && isCorrect && (
                        <Check className="h-5 w-5 text-green-600 animate-in zoom-in" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* In-Card Result Notification */}
            {result && (
              <div className="mt-8 animate-in slide-in-from-top-4 fade-in duration-500">
                <div
                  className={`p-8 rounded-[32px] border ${
                    result.isCorrect
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-destructive/5 border-destructive/20"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${
                        result.isCorrect ? "bg-green-500" : "bg-destructive"
                      }`}
                    >
                      {result.isCorrect ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`font-semibold text-lg ${result.isCorrect ? "text-green-700" : "text-destructive"}`}
                    >
                      {result.isCorrect
                        ? "Synthesis Verified"
                        : "Technical Divergence"}
                    </span>
                  </div>
                  {result.hint && (
                    <div className="flex items-start gap-4 p-5 bg-background border border-border/60 rounded-2xl shadow-sm">
                      <Lightbulb className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Pedagogical Insight
                        </p>
                        <p className="text-base text-foreground font-serif leading-relaxed italic opacity-80">
                          {result.hint}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          <div className="px-10 pb-10">
            {!result ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedAnswer || isSubmitting}
                className="w-full h-16 text-lg tracking-wide rounded-2xl shadow-xl shadow-black/5"
                size="xl"
              >
                {isSubmitting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "Verify Response"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="w-full h-16 text-lg tracking-wide rounded-2xl shadow-xl shadow-black/5"
                size="xl"
              >
                {currentIndex < questions.length - 1 ? (
                  <>
                    Transition to Next Unit
                    <ArrowRight className="h-6 w-6 ml-3" />
                  </>
                ) : (
                  "Finalize Assessment"
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
