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
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
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

  const toggleAnswer = (answerId: string) => {
    if (result || isSubmitting) return;
    setSelectedAnswers((prev) =>
      prev.includes(answerId)
        ? prev.filter((id) => id !== answerId)
        : [...prev, answerId],
    );
  };

  const submitAnswer = async () => {
    if (
      !currentQuestion ||
      isSubmitting ||
      result ||
      selectedAnswers.length === 0
    )
      return;

    if (isDemoMode) {
      // Simulate result for guest
      const correctAnswers = currentQuestion.answers.filter((a) => a.isCorrect);
      const isCorrect =
        correctAnswers.length === selectedAnswers.length &&
        correctAnswers.every((a) => selectedAnswers.includes(a.id));

      const guestResult = {
        id: "demo",
        isCorrect,
        selectedAnswerIds: selectedAnswers,
        correctAnswerIds: correctAnswers.map((a) => a.id),
        hint: currentQuestion.hint,
        question: { id: currentQuestion.id, content: currentQuestion.content },
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
          selectedAnswerIds: selectedAnswers,
        });
        setResult(data);
      } catch (error) {
        console.error("Failed to submit answer", error);
        setSelectedAnswers([]);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswers([]);
      setResult(null);
    } else {
      setCompleted(true);
    }
  };

  const handleRetry = async () => {
    // Reset all quiz state
    setCurrentIndex(0);
    setSelectedAnswers([]);
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            {isDemoMode ? "Preview complete" : "Quiz complete"}
          </h1>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            {isDemoMode
              ? "You've finished the guest preview. Sign up to unlock the full course and track your progress."
              : "You've completed all questions in this session."}
          </p>

          {(progress || isDemoMode) && (
            <div className="mt-12 p-10 bg-card rounded-[32px] border border-border relative overflow-hidden">
              {isDemoMode && (
                <div className="absolute top-0 right-0 p-4">
                  <Badge variant="secondary">GUEST MODE</Badge>
                </div>
              )}
              <p className="text-sm font-medium text-muted-foreground">
                Your score
              </p>
              <p className="text-6xl font-semibold text-primary mt-4 tracking-tighter">
                {isDemoMode
                  ? `${Math.round((demoStats.correct / demoStats.total) * 100)}%`
                  : `${progress?.percentage}%`}
              </p>
              <p className="text-muted-foreground mt-6 font-serif text-lg italic">
                {isDemoMode
                  ? `${demoStats.correct} / ${demoStats.total} correct`
                  : `${progress?.correct} / ${progress?.totalQuestions} correct`}
              </p>
            </div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            {isDemoMode ? (
              <>
                <Button
                  size="lg"
                  className="px-8 font-bold"
                  onClick={() => setShowAuthModal(true)}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Save progress
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 font-semibold rounded-xl"
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
                  Retry quiz
                </Button>
                <Link href="/progress">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 font-semibold rounded-xl"
                  >
                    View progress
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="px-8 font-semibold rounded-xl"
                  >
                    Back to courses
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        <AuthPromptModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="Don't lose your progress"
          description={`You answered ${demoStats.correct} questions correctly! Create a free account to save your results.`}
        />
      </DashboardLayout>
    );
  }

  if (!currentQuestion) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No questions available</p>
          <Link href="/courses">
            <Button className="mt-4 rounded-xl">Back to courses</Button>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Quiz Progress
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">
                {Math.round(
                  ((currentIndex + (result ? 1 : 0)) / questions.length) * 100,
                )}
                %
              </span>
            </div>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden p-[2px]">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{
                width: `${
                  ((currentIndex + (result ? 1 : 0)) / questions.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Question & Interaction Unit */}
        <Card className="bg-card overflow-hidden shadow-sm border-border/50">
          <CardHeader className="p-8 md:p-10 pb-6 border-b border-border/40 bg-muted/10">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Question Number & Hits */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold px-3 py-1 rounded-md text-sm">
                      Question {currentIndex + 1}
                    </span>
                    {currentQuestion.answers.filter((a) => a.isCorrect).length >
                      1 &&
                      !result && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-md">
                          <Check className="h-3.5 w-3.5" />
                          Select all that apply
                        </span>
                      )}
                  </div>

                  {/* The actual question */}
                  <CardTitle className="text-2xl md:text-3xl font-semibold leading-normal tracking-tight text-foreground font-sans">
                    {currentQuestion.content}
                  </CardTitle>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const query = encodeURIComponent(currentQuestion.content);
                    window.open(
                      `https://www.google.com/search?q=${query}`,
                      "_blank",
                    );
                  }}
                  className="flex items-center gap-2 text-xs font-medium shrink-0 shadow-sm whitespace-nowrap"
                >
                  <Search className="h-3.5 w-3.5" />
                  Search topic
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 md:p-10 pt-8 space-y-8 bg-card">
            <div className="grid gap-3">
              {currentQuestion.answers.map((answer, index) => {
                const letter = String.fromCharCode(65 + index);
                const isSelected = selectedAnswers.includes(answer.id);
                const showResult = result !== null;
                const isCorrect = result
                  ? result.correctAnswerIds.includes(answer.id)
                  : answer.isCorrect;
                const wasSelected = result?.selectedAnswerIds.includes(
                  answer.id,
                );

                return (
                  <button
                    key={answer.id}
                    type="button"
                    onClick={() => toggleAnswer(answer.id)}
                    disabled={!!result || isSubmitting}
                    className={cn(
                      "group w-full text-left p-4 rounded-xl border-2 transition-all duration-200 whitespace-normal cursor-pointer",
                      // Default unselected state
                      !isSelected &&
                        !showResult &&
                        "bg-background border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm",
                      // Selected state (before submission) — vivid, unmistakable
                      isSelected &&
                        !showResult &&
                        "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-md scale-[1.01]",
                      // Result states
                      showResult &&
                        isCorrect &&
                        "bg-green-500/10 border-green-500 shadow-[0_0_16px_rgba(34,197,94,0.1)]",
                      showResult &&
                        wasSelected &&
                        !isCorrect &&
                        "bg-red-500/10 border-red-500",
                      showResult &&
                        !isCorrect &&
                        !wasSelected &&
                        "opacity-40 grayscale border-border/40",
                      // Disabled styling
                      (!!result || isSubmitting) && "cursor-default",
                    )}
                  >
                    <div className="flex items-center gap-4 w-full">
                      {/* Checkbox / Letter indicator */}
                      <span
                        className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all duration-200",
                          // Default
                          !isSelected &&
                            !showResult &&
                            "bg-secondary text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary",
                          // Selected — solid primary fill
                          isSelected &&
                            !showResult &&
                            "bg-primary text-white shadow-sm",
                          // Result correct
                          showResult && isCorrect && "bg-green-500 text-white",
                          // Result wrong selected
                          showResult &&
                            wasSelected &&
                            !isCorrect &&
                            "bg-red-500 text-white",
                        )}
                      >
                        {showResult && isCorrect ? (
                          <Check className="h-5 w-5" />
                        ) : showResult && wasSelected && !isCorrect ? (
                          <X className="h-5 w-5" />
                        ) : isSelected && !showResult ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          letter
                        )}
                      </span>

                      {/* Answer text */}
                      <span
                        className={cn(
                          "text-base font-medium leading-relaxed flex-1 whitespace-normal break-words transition-colors duration-200",
                          isSelected && !showResult && "text-foreground",
                          !isSelected &&
                            !showResult &&
                            "text-muted-foreground group-hover:text-foreground",
                          showResult &&
                            isCorrect &&
                            "text-green-800 dark:text-green-300",
                          showResult &&
                            wasSelected &&
                            !isCorrect &&
                            "text-red-700 dark:text-red-300",
                        )}
                      >
                        {answer.content}
                      </span>

                      {/* Trailing indicator */}
                      {showResult && isCorrect && (
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 animate-in zoom-in" />
                      )}
                      {showResult && wasSelected && !isCorrect && (
                        <X className="h-5 w-5 text-red-500 flex-shrink-0 animate-in zoom-in" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Check Answer Button */}
            {!result && (
              <div className="mt-8 flex items-center justify-between">
                {selectedAnswers.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedAnswers.length} selected
                  </span>
                )}
                <div className={selectedAnswers.length === 0 ? "ml-auto" : ""}>
                  <Button
                    onClick={submitAnswer}
                    disabled={selectedAnswers.length === 0 || isSubmitting}
                    className="rounded-xl px-8 h-12 text-base font-semibold shadow-sm"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Check className="h-5 w-5 mr-2" />
                    )}
                    Check Answer
                  </Button>
                </div>
              </div>
            )}

            {/* In-Card Result Notification */}
            {result && (
              <div className="mt-8 animate-in slide-in-from-top-4 fade-in duration-500">
                <div
                  className={`p-6 rounded-2xl border ${
                    result.isCorrect
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-destructive/10 border-destructive/20"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-primary-foreground ${
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
                      {result.isCorrect ? "Correct!" : "Incorrect"}
                    </span>
                  </div>
                  {result.hint && (
                    <div className="flex items-start gap-4 p-5 bg-background border border-border/60 rounded-2xl shadow-sm">
                      <Lightbulb className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {result.hint}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer Actions - Only show when result is there (for next question) */}
          {result && (
            <div className="px-10 pb-10">
              <Button
                onClick={handleNext}
                className="w-full h-12 text-base rounded-xl"
              >
                {currentIndex < questions.length - 1 ? (
                  <>
                    Next question
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                ) : (
                  "Finish quiz"
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
