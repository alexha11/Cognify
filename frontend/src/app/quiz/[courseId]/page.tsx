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
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
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
          setQuestions((allQuestions || []).slice(0, 10));
        } else {
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
          if (unanswered.length === 0) setCompleted(true);
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
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setResult(null);
    setCompleted(false);
    setDemoStats({ correct: 0, total: 0 });
    setIsLoading(true);
    try {
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

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Completion screen ─────────────────────────────────────────────────────
  if (completed) {
    const pct = isDemoMode
      ? Math.round((demoStats.correct / demoStats.total) * 100)
      : (progress?.percentage ?? 0);
    const correct = isDemoMode ? demoStats.correct : (progress?.correct ?? 0);
    const total = isDemoMode
      ? demoStats.total
      : (progress?.totalQuestions ?? 0);

    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-16 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {isDemoMode ? "Preview complete" : "Quiz complete"}
          </h1>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
            {isDemoMode
              ? "You've finished the guest preview. Sign up to unlock the full course and track your progress."
              : "You've completed all questions in this session."}
          </p>

          {/* Score card */}
          <div className="mt-10 p-8 bg-card rounded-2xl border border-border relative overflow-hidden">
            {isDemoMode && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="text-xs">
                  Guest mode
                </Badge>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-800/40">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {correct}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Correct</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/25 border border-red-200/60 dark:border-red-800/40">
                <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                  {total - correct}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Incorrect
                </p>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
                <p className="text-2xl font-bold text-primary">{pct}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">Score</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            {isDemoMode ? (
              <>
                <Button
                  size="lg"
                  className="rounded-xl px-8 font-semibold"
                  onClick={() => setShowAuthModal(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Save progress
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl px-8"
                  onClick={handleRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="rounded-xl px-8 font-semibold"
                  onClick={handleRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry quiz
                </Button>
                <Link href="/progress">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl px-8"
                  >
                    View progress
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="ghost" className="rounded-xl px-8">
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

  // ── No questions ──────────────────────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No questions available.</p>
          <Link href="/courses">
            <Button className="mt-4 rounded-xl">Back to courses</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8 py-4">
        {/* Top nav row */}
        <div className="flex items-center justify-between">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>
          <Badge variant="outline" className="text-xs">
            {currentIndex + 1} / {questions.length}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Progress
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                {} / {demoStats.total} correct
              </span>
              <span className="text-sm font-bold text-primary">
                {Math.round(
                  ((currentIndex + (result ? 1 : 0)) / questions.length) * 100,
                )}
                %
              </span>
            </div>
          </div>
          <div className="h-4 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden shadow-inner ring-1 ring-inset ring-black/5 dark:ring-white/5">
            <div
              className="h-full bg-[#FAF9F5] rounded-full transition-all duration-700 ease-out shadow-md"
              style={{
                width: `${
                  ((currentIndex + (result ? 1 : 0)) / questions.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <Card className="overflow-hidden shadow-sm border-border/50">
          {/* ── Card header ── */}
          <CardHeader className="p-8 md:p-10 pb-8 border-b border-border/40 bg-muted/10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 space-y-4">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center bg-primary/10 text-primary font-semibold px-3 py-1 rounded-md text-xs">
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
                  {isDemoMode && (
                    <Badge variant="secondary" className="text-xs">
                      Guest preview
                    </Badge>
                  )}
                </div>

                {/* Question text */}
                <CardTitle className="text-2xl md:text-3xl font-semibold leading-snug tracking-tight text-foreground [&>p]:mb-4 [&>p:last-child]:mb-0 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {currentQuestion.content}
                  </ReactMarkdown>
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
          </CardHeader>

          {/* ── Card body: answers + actions ── */}
          <CardContent className="p-8 md:p-10 pt-7 space-y-6 bg-card">
            {/* Answer list */}
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
                      // base
                      "group relative w-full text-left rounded-xl border transition-all duration-150",
                      "p-4 pl-5",
                      !!result || isSubmitting
                        ? "cursor-default"
                        : "cursor-pointer",

                      // default
                      !isSelected &&
                        !showResult &&
                        "bg-background border-border hover:border-primary/60 hover:bg-primary/5",

                      // SELECTED — strong + unmissable
                      isSelected &&
                        !showResult && [
                          "bg-primary/[0.09] border-primary",
                          "ring-2 ring-primary/20",
                          "shadow-sm",
                        ],

                      // correct
                      showResult &&
                        isCorrect &&
                        "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-400 dark:border-emerald-600",

                      // wrong + selected
                      showResult &&
                        wasSelected &&
                        !isCorrect &&
                        "bg-red-50 dark:bg-red-950/25 border-red-400 dark:border-red-600",

                      // wrong + unselected: dimmed
                      showResult &&
                        !isCorrect &&
                        !wasSelected &&
                        "opacity-35 border-border/30",
                    )}
                  >
                    {/* Left accent bar */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 top-3 bottom-3 rounded-r-full transition-all duration-150",
                        !isSelected && !showResult && "w-0",
                        isSelected && !showResult && "w-1 bg-primary",
                        showResult && isCorrect && "w-1 bg-emerald-500",
                        showResult &&
                          wasSelected &&
                          !isCorrect &&
                          "w-1 bg-red-500",
                        showResult && !isCorrect && !wasSelected && "w-0",
                      )}
                    />

                    <div className="flex items-center gap-3.5 w-full">
                      {/* Letter / icon badge */}
                      <span
                        className={cn(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-150 border",

                          // outlined by default
                          !isSelected &&
                            !showResult &&
                            "bg-background border-border text-muted-foreground group-hover:border-primary/60 group-hover:text-primary group-hover:bg-primary/5",

                          // SELECTED: solid fill
                          isSelected &&
                            !showResult &&
                            "bg-primary border-primary text-white shadow-sm",

                          // correct
                          showResult &&
                            isCorrect &&
                            "bg-emerald-500 border-emerald-500 text-white",

                          // wrong + selected
                          showResult &&
                            wasSelected &&
                            !isCorrect &&
                            "bg-red-500 border-red-500 text-white",

                          // wrong + unselected
                          showResult &&
                            !isCorrect &&
                            !wasSelected &&
                            "bg-muted border-border/40 text-muted-foreground/50",
                        )}
                      >
                        {showResult && isCorrect ? (
                          <Check className="h-4 w-4" />
                        ) : showResult && wasSelected && !isCorrect ? (
                          <X className="h-4 w-4" />
                        ) : isSelected && !showResult ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          letter
                        )}
                      </span>

                      {/* Answer text */}
                      <span
                        className={cn(
                          "text-sm leading-relaxed flex-1 whitespace-normal break-words transition-colors duration-150",
                          "[&>p]:mb-2 [&>p:last-child]:mb-0",

                          !isSelected &&
                            !showResult &&
                            "text-muted-foreground group-hover:text-foreground",

                          isSelected &&
                            !showResult &&
                            "text-foreground font-medium",

                          showResult &&
                            isCorrect &&
                            "text-emerald-800 dark:text-emerald-300 font-medium",

                          showResult &&
                            wasSelected &&
                            !isCorrect &&
                            "text-red-700 dark:text-red-300",

                          showResult &&
                            !isCorrect &&
                            !wasSelected &&
                            "text-muted-foreground/50",
                        )}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {answer.content}
                        </ReactMarkdown>
                      </span>

                      {/* Trailing result icon */}
                      {showResult && isCorrect && (
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 animate-in zoom-in duration-200" />
                      )}
                      {showResult && wasSelected && !isCorrect && (
                        <X className="h-4 w-4 text-red-500 flex-shrink-0 animate-in zoom-in duration-200" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Check answer row ── */}
            {!result && (
              <div className="flex items-center justify-between pt-1">
                <div className="min-h-[2rem] flex items-center">
                  {selectedAnswers.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full animate-in fade-in duration-150">
                      <Check className="h-3 w-3" />
                      {selectedAnswers.length} selected
                    </span>
                  )}
                </div>
                <Button
                  onClick={submitAnswer}
                  disabled={selectedAnswers.length === 0 || isSubmitting}
                  className="rounded-xl px-6 h-10 text-sm font-semibold"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-2" />
                  )}
                  Check answer
                </Button>
              </div>
            )}

            {/* ── Result feedback ── */}
            {result && (
              <div className="space-y-5 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div
                  className={cn(
                    "flex items-start gap-4 p-5 rounded-xl border",
                    result.isCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-300/70 dark:border-emerald-700/50"
                      : "bg-red-50 dark:bg-red-950/25 border-red-300/70 dark:border-red-700/50",
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      result.isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white",
                    )}
                  >
                    {result.isCorrect ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        result.isCorrect
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {result.isCorrect ? "Correct!" : "Not quite right."}
                    </p>
                    {result.hint && (
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {result.hint}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Next question / finish */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleNext}
                    className="rounded-xl px-6 h-10 text-sm font-semibold"
                  >
                    {currentIndex < questions.length - 1 ? (
                      <>
                        Next question
                        <ArrowRight className="h-3.5 w-3.5 ml-2" />
                      </>
                    ) : (
                      <>
                        Finish quiz
                        <Trophy className="h-3.5 w-3.5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
