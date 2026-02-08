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
import { AuthPromptModal } from "@/components/ui";
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
        <div className="max-w-xl mx-auto py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isDemoMode ? "Demo Quiz Complete!" : "Quiz Complete!"}
          </h1>
          <p className="mt-4 text-gray-500">
            {isDemoMode
              ? "You've finished the guest preview. Sign up to unlock all questions!"
              : "You've answered all available questions for this course."}
          </p>

          {(progress || isDemoMode) && (
            <div className="mt-6 p-8 bg-white dark:bg-gray-900 rounded-2xl border-2 border-indigo-50 dark:border-indigo-900/50 shadow-sm relative overflow-hidden">
              {isDemoMode && (
                <div className="absolute top-0 right-0 p-2">
                  <Badge className="bg-indigo-500">GUEST MODE</Badge>
                </div>
              )}
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">
                Final Score
              </p>
              <p className="text-5xl font-black text-indigo-600 mt-2">
                {isDemoMode
                  ? `${Math.round((demoStats.correct / demoStats.total) * 100)}%`
                  : `${progress?.percentage}%`}
              </p>
              <p className="text-gray-500 mt-4 font-medium italic">
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
                <Link href="/courses">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 font-semibold"
                  >
                    Explore Other Courses
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/progress">
                  <Button size="lg" className="px-8 font-bold">
                    View Progress
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button
                    size="lg"
                    variant="outline"
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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>
          <Badge variant="secondary">
            Question {currentIndex + 1} of {questions.length}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{
              width: `${((currentIndex + (result ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Question Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.content}
              </CardTitle>
              <button
                onClick={() => {
                  const query = encodeURIComponent(currentQuestion.content);
                  window.open(
                    `https://www.google.com/search?q=${query}`,
                    "_blank",
                  );
                }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                title="Search this question on Google"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search Google</span>
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.answers.map((answer, index) => {
              const letter = String.fromCharCode(65 + index);
              const isSelected = selectedAnswer === answer.id;
              const showResult = result !== null;
              const isCorrect = answer.isCorrect;
              const wasSelected = result?.selectedAnswer.id === answer.id;

              let bgClass =
                "bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800";
              let borderClass = "border-gray-200 dark:border-gray-800";

              if (showResult) {
                if (isCorrect) {
                  bgClass = "bg-green-50 dark:bg-green-900/20";
                  borderClass = "border-green-500";
                } else if (wasSelected && !isCorrect) {
                  bgClass = "bg-red-50 dark:bg-red-900/20";
                  borderClass = "border-red-500";
                }
              } else if (isSelected) {
                bgClass = "bg-indigo-50 dark:bg-indigo-900/20";
                borderClass = "border-indigo-500";
              }

              return (
                <button
                  key={answer.id}
                  onClick={() => !result && setSelectedAnswer(answer.id)}
                  disabled={!!result}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${bgClass} ${borderClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg font-medium ${
                        isSelected && !showResult
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="flex-1">{answer.content}</span>
                    {showResult && isCorrect && (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                    {showResult && wasSelected && !isCorrect && (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Result & Hint */}
        {result && (
          <Card
            className={
              result.isCorrect
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {result.isCorrect ? (
                  <Check className="h-6 w-6 text-green-600" />
                ) : (
                  <X className="h-6 w-6 text-red-600" />
                )}
                <p
                  className={`font-semibold ${result.isCorrect ? "text-green-700" : "text-red-700"}`}
                >
                  {result.isCorrect ? "Correct!" : "Incorrect"}
                </p>
              </div>
              {result.hint && !result.isCorrect && (
                <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500" />
                  <p>{result.hint}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {!result ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedAnswer || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Answer"
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                "Finish Quiz"
              )}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
