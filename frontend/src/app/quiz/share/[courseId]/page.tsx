"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { Question, AttemptResult } from "@/types";
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
  Share2,
} from "lucide-react";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiGet<PublicCourseData>(
          `/questions/course/${courseId}/public`,
        );
        setCourseName(data.course.name);
        setCourseDescription(data.course.description || "");
        // Shuffle questions for variety
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

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setResult(null);
    setCompleted(false);
    setStats({ correct: 0, total: 0 });
    // Re-shuffle questions
    setQuestions((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading shared quiz...
          </p>
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
            <h2 className="text-xl font-semibold">Quiz Not Found</h2>
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

  // Completion screen
  if (completed) {
    const percentage =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Share2 className="h-5 w-5 text-primary/60" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
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
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">
                  Quiz Complete!
                </h2>
                <p className="text-muted-foreground text-lg">
                  You scored{" "}
                  <span className="text-primary font-bold">
                    {stats.correct}/{stats.total}
                  </span>{" "}
                  ({percentage}%)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.correct}
                  </p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                  <p className="text-2xl font-bold text-red-500">
                    {stats.total - stats.correct}
                  </p>
                  <p className="text-xs text-muted-foreground">Incorrect</p>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-2xl font-bold text-primary">
                    {percentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Link href="/">
                  <Button variant="pill" size="lg">
                    <Sparkles className="h-4 w-4 mr-2" />
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
        {/* Shared Quiz Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Share2 className="h-5 w-5 text-primary/60" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
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

        {/* Question Card */}
        <Card className="bg-card overflow-hidden shadow-sm border-border/50">
          <CardHeader className="p-8 md:p-10 pb-6 border-b border-border/40 bg-muted/10">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold px-3 py-1 rounded-md text-sm">
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
                  <CardTitle className="text-2xl md:text-3xl font-semibold leading-normal tracking-tight text-foreground">
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
                    disabled={!!result}
                    className={cn(
                      "group w-full text-left p-4 rounded-xl border-2 transition-all duration-200 whitespace-normal cursor-pointer",
                      !isSelected &&
                        !showResult &&
                        "bg-background border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm",
                      isSelected &&
                        !showResult &&
                        "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-md scale-[1.01]",
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
                      !!result && "cursor-default",
                    )}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <span
                        className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all duration-200",
                          !isSelected &&
                            !showResult &&
                            "bg-secondary text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary",
                          isSelected &&
                            !showResult &&
                            "bg-primary text-white shadow-sm",
                          showResult && isCorrect && "bg-green-500 text-white",
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
                    disabled={selectedAnswers.length === 0}
                    className="rounded-xl px-8 h-12 text-base font-semibold shadow-sm"
                    size="lg"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Check Answer
                  </Button>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="mt-8 animate-in slide-in-from-top-4 fade-in duration-500">
                <div
                  className={`p-6 rounded-2xl border ${
                    result.isCorrect
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        result.isCorrect
                          ? "bg-green-500/20 text-green-600"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {result.isCorrect ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p
                        className={`text-lg font-semibold ${
                          result.isCorrect ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {result.isCorrect ? "Correct!" : "Not quite right."}
                      </p>
                      {result.hint && (
                        <div className="flex items-start gap-2 pt-1">
                          <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground italic">
                            {result.hint}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleNext}
                    className="rounded-xl px-8"
                    size="lg"
                  >
                    {currentIndex < questions.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        See Results
                        <Trophy className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-4">
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
