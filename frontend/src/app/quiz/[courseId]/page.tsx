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
import { Question, AttemptResult, QuizProgress } from "@/types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Trophy,
  Loader2,
  Sparkles,
  RefreshCw,
  Medal,
  Info,
  Check,
  X,
  FileQuestion,
  Target,
  Award,
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
  const [isExplicitlyFinished, setIsExplicitlyFinished] = useState(false);

  // Map of questionId -> isCorrect for historical & current runs
  const [attemptsMap, setAttemptsMap] = useState<Record<string, boolean>>({});
  // Map of questionId -> isCorrect for the ACTIVE session run
  const [sessionAttemptsMap, setSessionAttemptsMap] = useState<Record<string, boolean>>({});

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuestNameModal, setShowGuestNameModal] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isGuest = !authLoading && !user;

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      try {
        const rawQuestions = await apiGet<Question[]>(
          `/questions/course/${courseId}`,
        );
        const availableQuestions = rawQuestions || [];
        setQuestions(availableQuestions);

        if (!isGuest && availableQuestions.length > 0) {
          const [progressData, myAttempts] = await Promise.all([
            apiGet<QuizProgress>(`/attempts/progress/${courseId}`).catch(
              () => null,
            ),
            apiGet<
              {
                question: { id: string; courseId: string };
                isCorrect: boolean;
              }[]
            >("/attempts/me").catch(() => []),
          ]);

          // Populate existing attempts map ONLY for questions in THIS course
          if (myAttempts && Array.isArray(myAttempts)) {
            const initialMap: Record<string, boolean> = {};
            const courseQuestionIds = new Set(
              availableQuestions.map((q) => q.id),
            );

            myAttempts.forEach((a) => {
              const qId = a.question?.id || (a as any).questionId;
              if (qId && courseQuestionIds.has(qId)) {
                // If question was answered correctly in any attempt, count as correct
                if (a.isCorrect || initialMap[qId] === undefined) {
                  initialMap[qId] = a.isCorrect;
                }
              }
            });
            setAttemptsMap(initialMap);
          }

          if (progressData) {
            if (progressData.isCompleted) {
              await apiPost(`/attempts/reset/${courseId}`, {}).catch(() => {});
              setCurrentIndex(0);
            } else {
              const savedIdx = Math.min(
                progressData.currentIndex || 0,
                availableQuestions.length - 1,
              );
              setCurrentIndex(Math.max(0, savedIdx));
            }
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
      setSessionAttemptsMap((prev) => ({
        ...prev,
        [currentQuestion.id]: isCorrect,
      }));
      setAttemptsMap((prev) => ({
        ...prev,
        [currentQuestion.id]: isCorrect,
      }));
    } else {
      setIsSubmitting(true);
      try {
        const data = await apiPost<AttemptResult>("/attempts", {
          questionId: currentQuestion.id,
          selectedAnswerIds: selectedAnswers,
        });
        setResult(data);
        setSessionAttemptsMap((prev) => ({
          ...prev,
          [currentQuestion.id]: data.isCorrect,
        }));
        setAttemptsMap((prev) => ({
          ...prev,
          [currentQuestion.id]: data.isCorrect,
        }));
      } catch (error) {
        console.error("Failed to submit answer", error);
        setSelectedAnswers([]);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedAnswers([]);
      setResult(null);

      if (user) {
        apiPost(`/attempts/progress/${courseId}`, {
          currentIndex: nextIndex,
        }).catch((err) => {
          console.error("Failed to sync progress", err);
        });
      }
    } else {
      // Reached the end of quiz -> explicitly finish
      setIsExplicitlyFinished(true);

      if (user) {
        apiPost(`/attempts/progress/${courseId}`, {
          currentIndex: questions.length - 1,
          isCompleted: true,
        }).catch((err) => {
          console.error("Failed to mark completion", err);
        });
      }
    }
  };

  // Helper to compute overall quiz score strictly scoped to this course's questions
  const getScoreSummary = () => {
    const totalQuestions = questions.length || 1;
    let correctCount = 0;
    let answeredCount = 0;

    questions.forEach((q) => {
      if (attemptsMap[q.id] !== undefined) {
        answeredCount++;
        if (attemptsMap[q.id] === true) {
          correctCount++;
        }
      }
    });

    const incorrectCount = Math.max(0, totalQuestions - correctCount);
    const percentage = Math.min(
      100,
      Math.round((correctCount / totalQuestions) * 100),
    );

    return {
      correct: correctCount,
      incorrect: incorrectCount,
      total: totalQuestions,
      answered: answeredCount,
      percentage,
    };
  };

  const stats = getScoreSummary();

  // Auto-submit score for logged-in users when quiz explicitly completes
  useEffect(() => {
    if (isExplicitlyFinished && user && !scoreSubmitted && stats.total > 0) {
      setScoreSubmitted(true);
      apiPost("/leaderboard", {
        courseId,
        score: stats.correct,
        totalQuestions: stats.total,
      }).catch((err) => {
        console.error("Failed to submit leaderboard score", err);
      });
    }
  }, [isExplicitlyFinished, user, scoreSubmitted, stats, courseId]);

  // Show guest name modal when guest completes quiz
  useEffect(() => {
    if (isExplicitlyFinished && isGuest && !scoreSubmitted && stats.total > 0) {
      setShowGuestNameModal(true);
    }
  }, [isExplicitlyFinished, isGuest, scoreSubmitted, stats]);

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

  const handleRetry = async () => {
    setIsLoading(true);
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setResult(null);
    setIsExplicitlyFinished(false);
    setScoreSubmitted(false);
    setAttemptsMap({});

    if (user) {
      await apiPost(`/attempts/reset/${courseId}`, {}).catch(() => {});
    }

    try {
      const rawQuestions = await apiGet<Question[]>(
        `/questions/course/${courseId}`,
      );
      setQuestions(rawQuestions || []);
    } catch (error) {
      console.error("Failed to fetch questions", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  // ── Loading State ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Completion Screen (Explicitly Finished Guard) ──────────────────────
  if (isExplicitlyFinished) {
    const pct = stats.percentage;

    const getTierInfo = (p: number) => {
      if (p === 100) {
        return {
          badge: "PERFECT SCORE",
          title: "Flawless Victory!",
          description:
            "You answered every single question correctly. Masterclass performance!",
          badgeStyle:
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          iconStyle: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
          icon: Sparkles,
        };
      }
      if (p >= 80) {
        return {
          badge: "GREAT JOB",
          title: "Outstanding Performance!",
          description:
            "You've demonstrated a strong understanding of this material.",
          badgeStyle:
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          iconStyle: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
          icon: Trophy,
        };
      }
      if (p >= 50) {
        return {
          badge: "GOOD EFFORT",
          title: "Quiz Complete!",
          description:
            "Solid effort! Review your missed concepts to get a top score next time.",
          badgeStyle:
            "border-primary/30 bg-primary/10 text-primary dark:text-primary",
          iconStyle: "text-primary bg-primary/10 border-primary/30",
          icon: Target,
        };
      }
      return {
        badge: "KEEP PRACTICING",
        title: "Quiz Finished",
        description:
          "Practice makes perfect! Review the course material and attempt again.",
        badgeStyle:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        iconStyle: "text-amber-500 bg-amber-500/10 border-amber-500/30",
        icon: RefreshCw,
      };
    };

    const tier = getTierInfo(pct);
    const TierIcon = tier.icon;

    return (
      <DashboardLayout>
        <div className="relative max-w-2xl mx-auto py-12 px-4 space-y-8">
          {/* Ambient background glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[130px] rounded-full pointer-events-none -z-10" />

          {/* Hero header */}
          <div className="text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-primary/20 via-emerald-500/20 to-purple-500/20 blur-lg animate-pulse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-card border border-border/80 shadow-xl backdrop-blur-xl">
                <div
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-300",
                    tier.iconStyle,
                  )}
                >
                  <TierIcon className="h-10 w-10" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border shadow-sm",
                  tier.badgeStyle,
                )}
              >
                {tier.badge}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {tier.title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                {isGuest
                  ? "Create a free account to feature on the leaderboard and save your progress!"
                  : tier.description}
              </p>
            </div>
          </div>

          {/* Main score card */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-card/90 backdrop-blur-xl border border-border/80 shadow-2xl space-y-6">
            {/* Big percentage indicator */}
            <div className="flex flex-col items-center justify-center py-4 border-b border-border/40 space-y-1">
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-foreground">
                {pct}%
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Overall Accuracy
              </span>
            </div>

            {/* Stat metrics grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {/* Correct */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span className="text-2xl font-bold">{stats.correct}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Correct
                </p>
              </div>

              {/* Incorrect */}
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-red-500 dark:text-red-400">
                  <X className="h-4 w-4 stroke-[3]" />
                  <span className="text-2xl font-bold">{stats.incorrect}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Incorrect
                </p>
              </div>

              {/* Total Questions */}
              <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-primary">
                  <FileQuestion className="h-4 w-4 stroke-[2.5]" />
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Questions
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {isGuest ? (
              <>
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-xl px-8 font-semibold shadow-lg shadow-primary/20 gap-2"
                  onClick={() => setShowAuthModal(true)}
                >
                  <Sparkles className="h-4 w-4" />
                  Save progress
                </Button>
                <Link
                  href={`/ranking/${courseId}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-xl px-8 font-semibold gap-2 border-border/80"
                  >
                    <Medal className="h-4 w-4" />
                    View Ranking
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-xl px-8 font-semibold gap-2 border-border/80"
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              </>
            ) : (
              <>
                <Link
                  href={`/ranking/${courseId}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    className="w-full rounded-xl px-8 font-semibold shadow-lg shadow-primary/20 gap-2"
                  >
                    <Medal className="h-4 w-4" />
                    View Ranking
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-xl px-8 font-semibold gap-2 border-border/80"
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry quiz
                </Button>
                <Link href="/courses" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full rounded-xl px-6 text-muted-foreground hover:text-foreground"
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
          description={`You answered ${stats.correct} out of ${stats.total} questions correctly! Create a free account to save your results.`}
        />

        <GuestNameModal
          isOpen={showGuestNameModal}
          onSubmit={handleGuestScoreSubmit}
          onSkip={handleGuestScoreSkip}
          score={stats.correct}
          total={stats.total}
        />
      </DashboardLayout>
    );
  }

  // ── No Questions ──────────────────────────────────────────────────────────
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

  // ── Active Quiz Screen ───────────────────────────────────────────────────
  const activeAnsweredCount = Object.keys(attemptsMap).length;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        {/* Guest notification banner */}
        {isGuest && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span>
                You are taking this quiz as a guest. Log in to save your
                progress.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-semibold rounded-lg"
              onClick={() => setShowAuthModal(true)}
            >
              Log in
            </Button>
          </div>
        )}

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

        {/* Progress bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Progress
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                {Object.values(sessionAttemptsMap).filter(Boolean).length} /{" "}
                {questions.length} correct
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
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{
                width: `${
                  ((currentIndex + (result ? 1 : 0)) / questions.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Quiz card */}
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

      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Log in to save progress"
        description="Create an account or sign in to track your scores, save quiz progress, and feature on the course leaderboard."
      />
    </DashboardLayout>
  );
}
