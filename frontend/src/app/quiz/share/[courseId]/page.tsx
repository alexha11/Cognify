"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { Question, AttemptResult } from "@/types";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  Check,
  X,
  Lightbulb,
  ArrowRight,
  Trophy,
  Loader2,
  RefreshCw,
  Share2,
} from "lucide-react";
import { Search } from "lucide-react";

interface PublicCourseData {
  course: { id: string; name: string; description: string | null };
  questions: Question[];
}

export default function SharedQuizPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<PublicCourseData>(
        `/questions/course/${courseId}/public`,
      );
      setCourseName(data.course.name);
      setCourseDescription(data.course.description || "");
      const shuffled = [...(data.questions || [])].sort(
        () => Math.random() - 0.5,
      );
      setQuestions(shuffled);
    } catch (error) {
      console.error("Failed to fetch shared quiz data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const currentQuestion = questions[currentIndex];

  const toggleAnswer = (answerId: string) => {
    if (result) return;
    setSelectedAnswers((prev) =>
      prev.includes(answerId)
        ? prev.filter((id) => id !== answerId)
        : [...prev, answerId],
    );
  };

  const submitAnswer = () => {
    if (!currentQuestion || result || selectedAnswers.length === 0) return;
    const correctAnswers = currentQuestion.answers.filter((a) => a.isCorrect);
    const isCorrect =
      correctAnswers.length === selectedAnswers.length &&
      correctAnswers.every((a) => selectedAnswers.includes(a.id));
    const guestResult = {
      id: "guest",
      isCorrect,
      selectedAnswerIds: selectedAnswers,
      correctAnswerIds: correctAnswers.map((a) => a.id),
      hint: currentQuestion.hint,
      question: { id: currentQuestion.id, content: currentQuestion.content },
    };
    setResult(guestResult as AttemptResult);
    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
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
    setStats({ correct: 0, total: 0 });
    await fetchData();
  };

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading shared quiz…</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-12 text-center space-y-6">
            <X className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <h2 className="text-xl font-semibold">Quiz not found</h2>
            <p className="text-muted-foreground">
              This quiz doesn&apos;t exist or has no questions yet.
            </p>
            <Link href="/">
              <Button variant="outline">Go to Cognify</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Completion screen ──────────────────────────────────────────────────────
  if (completed) {
    const percentage =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="flex items-center gap-2.5 mb-3">
            <Share2 className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Shared Quiz
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-12">
            {courseName}
          </h1>

          <Card className="overflow-hidden">
            <CardContent className="p-12 text-center space-y-8">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  Quiz complete!
                </h2>
                <p className="text-muted-foreground text-lg">
                  You scored{" "}
                  <span className="text-primary font-bold">
                    {stats.correct}/{stats.total}
                  </span>{" "}
                  ({percentage}%)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-800/40">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.correct}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Correct
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/25 border border-red-200/60 dark:border-red-800/40">
                  <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                    {stats.total - stats.correct}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Incorrect
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15">
                  <p className="text-2xl font-bold text-primary">
                    {percentage}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Score</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try again
                </Button>
                <Link href="/">
                  <Button size="lg" className="rounded-xl">
                    Explore Cognify
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Share2 className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Shared Quiz
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {courseName}
          </h1>
          {courseDescription && (
            <p className="text-sm text-muted-foreground italic">
              {courseDescription}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Progress
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                {stats.correct} / {stats.total} correct
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
          {/* ── Card header: question ── */}
          <CardHeader className="p-8 md:p-10 pb-8 border-b border-border/40 bg-muted/10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 space-y-4">
                {/* badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center bg-primary/10 text-primary font-semibold px-3 py-1 rounded-md text-xs">
                    Question {currentIndex + 1} / {questions.length}
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

                {/* question text — larger, more breathing room */}
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
                    disabled={!!result}
                    className={cn(
                      // ── base ──────────────────────────────────────────────
                      "group relative w-full text-left rounded-xl border transition-all duration-150",
                      "p-4 pl-5",
                      !!result ? "cursor-default" : "cursor-pointer",

                      // ── default (not selected, no result) ─────────────────
                      !isSelected &&
                        !showResult &&
                        "bg-background border-border hover:border-primary/60 hover:bg-primary/5",

                      // ── SELECTED (pre-submit) ──────────────────────────────
                      // Strong primary tint + solid border + ring so it's unmissable
                      isSelected &&
                        !showResult && [
                          "bg-primary/[0.09] border-primary",
                          "ring-2 ring-primary/20",
                          "shadow-sm",
                        ],

                      // ── correct (post-submit) ──────────────────────────────
                      showResult &&
                        isCorrect &&
                        "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-400 dark:border-emerald-600",

                      // ── wrong + selected (post-submit) ────────────────────
                      showResult &&
                        wasSelected &&
                        !isCorrect &&
                        "bg-red-50 dark:bg-red-950/25 border-red-400 dark:border-red-600",

                      // ── wrong + not selected: dimmed ──────────────────────
                      showResult &&
                        !isCorrect &&
                        !wasSelected &&
                        "opacity-35 border-border/30",
                    )}
                  >
                    {/* Left accent bar — thicker when selected */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 top-3 bottom-3 rounded-r-full transition-all duration-150",
                        // visible only when active
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

                          // default: outlined
                          !isSelected &&
                            !showResult &&
                            "bg-background border-border text-muted-foreground group-hover:border-primary/60 group-hover:text-primary group-hover:bg-primary/5",

                          // SELECTED: solid primary fill — very obvious
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

                          // SELECTED: full-weight foreground so text is prominent
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
                  disabled={selectedAnswers.length === 0}
                  className="rounded-xl px-6 h-10 text-sm font-semibold"
                >
                  Check answer
                  <Check className="h-3.5 w-3.5 ml-2" />
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
                        See results
                        <Trophy className="h-3.5 w-3.5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <Link
              href="/"
              className="text-primary hover:underline font-semibold"
            >
              Cognify
            </Link>{" "}
            • Create your own quizzes for free
          </p>
        </div>
      </div>
    </div>
  );
}
