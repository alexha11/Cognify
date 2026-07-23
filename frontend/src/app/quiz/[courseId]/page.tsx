"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuizCard } from "@/components/ui/quiz-card";
import { AuthPromptModal } from "@/components/ui/auth-prompt-modal";
import { GuestNameModal } from "@/components/ui/guest-name-modal";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Question, AttemptResult, CourseProgress } from "@/types";
import { ArrowLeft, Trophy, Loader2, Sparkles, RefreshCw, Medal } from "lucide-react";

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
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuestNameModal, setShowGuestNameModal] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isGuest = !authLoading && !user;

  // Helper to Fisher-Yates shuffle an array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Helper to scramble answer choices inside every question and shuffle question order
  const scrambleQuestions = (qs: Question[]): Question[] => {
    const shuffledQs = shuffleArray(qs || []);
    return shuffledQs.map((q) => ({
      ...q,
      answers: q.answers ? shuffleArray(q.answers) : [],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      try {
        const rawQuestions = await apiGet<Question[]>(
          `/questions/course/${courseId}`,
        );

        if (isGuest) {
          // Guests see all questions scrambled
          setQuestions(scrambleQuestions(rawQuestions || []));
        } else {
          // Logged-in: filter out already-answered questions and scramble
          const [progressData, attemptsData] = await Promise.all([
            apiGet<CourseProgress>(`/attempts/course/${courseId}`),
            apiGet<{ question: Question }[]>("/attempts/me"),
          ]);
          const attemptedIds = new Set<string>();
          (attemptsData || []).forEach((a) => {
            if (a.question) attemptedIds.add(a.question.id);
          });
          const unanswered = (rawQuestions || []).filter(
            (q) => !attemptedIds.has(q.id),
          );
          setQuestions(scrambleQuestions(unanswered));
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
  }, [courseId, router, authLoading, isGuest]);

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

    if (isGuest) {
      // Guest mode: evaluate locally, no API call
      const correctAnswers = currentQuestion.answers.filter((a) => a.isCorrect);
      const isCorrect =
        correctAnswers.length === selectedAnswers.length &&
        correctAnswers.every((a) => selectedAnswers.includes(a.id));
      const guestResult: AttemptResult = {
        id: "guest",
        isCorrect,
        selectedAnswerIds: selectedAnswers,
        correctAnswerIds: correctAnswers.map((a) => a.id),
        hint: currentQuestion.hint,
        question: { id: currentQuestion.id, content: currentQuestion.content },
      } as AttemptResult;
      setResult(guestResult);
      setSessionStats((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
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
        setSessionStats((prev) => ({
          correct: prev.correct + (data.isCorrect ? 1 : 0),
          total: prev.total + 1,
        }));
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

  // Auto-submit score for logged-in users when quiz completes
  useEffect(() => {
    if (completed && user && !scoreSubmitted && sessionStats.total > 0) {
      setScoreSubmitted(true);
      apiPost("/leaderboard", {
        courseId,
        score: sessionStats.correct,
        totalQuestions: sessionStats.total,
      }).catch((err) => {
        console.error("Failed to submit leaderboard score", err);
      });

      // Refetch course progress so overall user stats are updated
      apiGet<CourseProgress>(`/attempts/course/${courseId}`)
        .then((newProgress) => setProgress(newProgress))
        .catch(() => {});
    }
  }, [completed, user, scoreSubmitted, sessionStats, courseId]);

  // Show guest name modal when guest completes quiz
  useEffect(() => {
    if (completed && isGuest && !scoreSubmitted && sessionStats.total > 0) {
      setShowGuestNameModal(true);
    }
  }, [completed, isGuest, scoreSubmitted, sessionStats]);

  const handleGuestScoreSubmit = async (name: string) => {
    setShowGuestNameModal(false);
    try {
      await apiPost("/leaderboard", {
        courseId,
        score: sessionStats.correct,
        totalQuestions: sessionStats.total,
        guestName: name,
      });
    } catch {}
    setScoreSubmitted(true);
  };

  const handleGuestScoreSkip = () => {
    setShowGuestNameModal(false);
    setScoreSubmitted(true);
  };

  const handleRetry = async () => {
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setResult(null);
    setCompleted(false);
    setScoreSubmitted(false);
    setSessionStats({ correct: 0, total: 0 });
    setIsLoading(true);
    try {
      const allQuestions = await apiGet<Question[]>(
        `/questions/course/${courseId}`,
      );
      setQuestions(scrambleQuestions(allQuestions || []));
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
    const correct = sessionStats.correct;
    const total = sessionStats.total;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-16 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Quiz complete
          </h1>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
            {isGuest
              ? "Sign up to save your progress and track your performance over time."
              : "You've completed all questions in this session."}
          </p>

          {/* Score card */}
          <div className="mt-10 p-8 bg-card rounded-2xl border border-border">
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
            {isGuest ? (
              <>
                <Button
                  size="lg"
                  className="rounded-xl px-8 font-semibold"
                  onClick={() => setShowAuthModal(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Save progress
                </Button>
                <Link href={`/ranking/${courseId}`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl px-8 w-full"
                  >
                    <Medal className="mr-2 h-4 w-4" />
                    View Ranking
                  </Button>
                </Link>
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
                <Link href={`/ranking/${courseId}`}>
                  <Button
                    size="lg"
                    className="rounded-xl px-8 font-semibold"
                  >
                    <Medal className="mr-2 h-4 w-4" />
                    View Ranking
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl px-8"
                  onClick={handleRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry quiz
                </Button>
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
          description={`You answered ${sessionStats.correct} out of ${sessionStats.total} correctly! Create a free account to save your results.`}
        />

        <GuestNameModal
          isOpen={showGuestNameModal}
          onSubmit={handleGuestScoreSubmit}
          onSkip={handleGuestScoreSkip}
          score={sessionStats.correct}
          total={sessionStats.total}
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
                {sessionStats.correct} / {sessionStats.total} correct
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
          isSubmitting={isSubmitting}
          onToggleAnswer={toggleAnswer}
          onSubmit={submitAnswer}
          onNext={handleNext}
          isLastQuestion={currentIndex === questions.length - 1}
        />
      </div>
    </DashboardLayout>
  );
}
