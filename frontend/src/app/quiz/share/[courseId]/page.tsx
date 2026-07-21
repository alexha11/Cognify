"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuizCard } from "@/components/ui/quiz-card";
import { GuestNameModal } from "@/components/ui/guest-name-modal";
import { apiGet, apiPost } from "@/lib/api";
import { Question, AttemptResult } from "@/types";
import { Loader2, X, Trophy, RefreshCw, Share2, Medal } from "lucide-react";

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
  const [showGuestNameModal, setShowGuestNameModal] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
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

  // Show guest name modal on completion
  useEffect(() => {
    if (completed && !scoreSubmitted && stats.total > 0) {
      setShowGuestNameModal(true);
    }
  }, [completed, scoreSubmitted, stats]);

  const handleGuestScoreSubmit = async (name: string) => {
    setShowGuestNameModal(false);
    try {
      await apiPost("/leaderboard", {
        courseId,
        score: stats.correct,
        totalQuestions: stats.total,
        guestName: name,
      });
    } catch {}
    setScoreSubmitted(true);
  };

  const handleGuestScoreSkip = () => {
    setShowGuestNameModal(false);
    setScoreSubmitted(true);
  };

  if (!isMounted) return null;

  // ── Loading ───────────────────────────────────────────────────────────────
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

  // ── Empty ─────────────────────────────────────────────────────────────────
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

  // ── Completion screen ─────────────────────────────────────────────────────
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
                <Link href={`/ranking/${courseId}`}>
                  <Button size="lg" className="rounded-xl w-full">
                    <Medal className="h-4 w-4 mr-2" />
                    View Ranking
                  </Button>
                </Link>
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
                  <Button size="lg" variant="ghost" className="rounded-xl w-full">
                    Explore Cognify
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <GuestNameModal
            isOpen={showGuestNameModal}
            onSubmit={handleGuestScoreSubmit}
            onSkip={handleGuestScoreSkip}
            score={stats.correct}
            total={stats.total}
          />

          <p className="text-center text-xs text-muted-foreground mt-8">
            Powered by{" "}
            <Link
              href="/"
              className="text-primary hover:underline font-semibold"
            >
              Cognify
            </Link>{" "}
            · Create your own quizzes for free
          </p>
        </div>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────
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

        {/* Quiz card — shared component */}
        <QuizCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          selectedAnswers={selectedAnswers}
          result={result}
          onToggleAnswer={toggleAnswer}
          onSubmit={submitAnswer}
          onNext={handleNext}
          isLastQuestion={currentIndex === questions.length - 1}
        />

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
            · Create your own quizzes for free
          </p>
        </div>
      </div>
    </div>
  );
}
