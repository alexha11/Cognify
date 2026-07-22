"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttemptResult, Question } from "@/types";
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
  Search,
} from "lucide-react";

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswers: string[];
  result: AttemptResult | null;
  isSubmitting?: boolean;
  onToggleAnswer: (answerId: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  isLastQuestion: boolean;
}

export function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswers,
  result,
  isSubmitting = false,
  onToggleAnswer,
  onSubmit,
  onNext,
  isLastQuestion,
}: QuizCardProps) {
  return (
    <Card className="overflow-hidden shadow-sm border-border/50">
      {/* ── Card header: question ── */}
      <CardHeader className="p-8 md:p-10 pb-8 border-b border-border/40 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center bg-primary/10 text-primary font-semibold px-3 py-1 rounded-md text-xs">
                Question {questionNumber} / {totalQuestions}
              </span>
              {question.answers.filter((a) => a.isCorrect).length > 1 &&
                !result && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-md">
                    <Check className="h-3.5 w-3.5" />
                    Select all that apply
                  </span>
                )}
            </div>

            {/* Question text / image */}
            {question.contentType === 'image' && question.imageUrl ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border border-border/60 bg-muted/20 p-2">
                  <img
                    src={question.imageUrl}
                    alt={question.content || "Question image"}
                    className="max-h-72 w-full object-contain rounded-xl"
                  />
                </div>
                {question.content && (
                  <CardTitle className="text-xl md:text-2xl font-semibold leading-snug tracking-tight text-foreground [&>p]:mb-4 [&>p:last-child]:mb-0">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {question.content}
                    </ReactMarkdown>
                  </CardTitle>
                )}
              </div>
            ) : (
              <CardTitle className="text-2xl md:text-3xl font-semibold leading-snug tracking-tight text-foreground [&>p]:mb-4 [&>p:last-child]:mb-0 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {question.content}
                </ReactMarkdown>
              </CardTitle>
            )}
          </div>

          <button
            onClick={() => {
              const query = encodeURIComponent(question.content);
              window.open(`https://www.google.com/search?q=${query}`, "_blank");
            }}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/60 hover:border-border px-4 py-2 rounded-xl transition-all shrink-0 bg-background hover:bg-muted/30"
          >
            <Search className="h-3.5 w-3.5" />
            Search topic
          </button>
        </div>
      </CardHeader>

      {/* ── Card body: answers + actions ── */}
      <CardContent className="p-8 md:p-10 pt-7 space-y-6 bg-card">
        {/* Answer list */}
        <div className="grid gap-3">
          {question.answers.map((answer, index) => {
            const letter = String.fromCharCode(65 + index);
            const isSelected = selectedAnswers.includes(answer.id);
            const showResult = result !== null;
            const isCorrect = result
              ? result.correctAnswerIds.includes(answer.id)
              : answer.isCorrect;
            const wasSelected = result?.selectedAnswerIds.includes(answer.id);

            return (
              <button
                key={answer.id}
                type="button"
                onClick={() => onToggleAnswer(answer.id)}
                disabled={!!result || isSubmitting}
                className={cn(
                  "group relative w-full text-left rounded-xl border transition-all duration-150",
                  "p-4 pl-5",
                  !!result || isSubmitting ? "cursor-default" : "cursor-pointer",

                  // default
                  !isSelected &&
                    !showResult &&
                    "bg-background border-border hover:border-primary/60 hover:bg-primary/5",

                  // SELECTED — unmissable primary fill
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
                  showResult && !isCorrect && !wasSelected && "opacity-35 border-border/30",
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
                    showResult && wasSelected && !isCorrect && "w-1 bg-red-500",
                    showResult && !isCorrect && !wasSelected && "w-0",
                  )}
                />

                <div className="flex items-center gap-3.5 w-full">
                  {/* Letter / icon badge */}
                  <span
                    className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-150 border",
                      !isSelected &&
                        !showResult &&
                        "bg-background border-border text-muted-foreground group-hover:border-primary/60 group-hover:text-primary group-hover:bg-primary/5",
                      isSelected &&
                        !showResult &&
                        "bg-primary border-primary text-white shadow-sm",
                      showResult && isCorrect && "bg-emerald-500 border-emerald-500 text-white",
                      showResult && wasSelected && !isCorrect && "bg-red-500 border-red-500 text-white",
                      showResult && !isCorrect && !wasSelected && "bg-muted border-border/40 text-muted-foreground/50",
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
                      "text-sm leading-relaxed flex-1 whitespace-normal break-words transition-colors duration-150 [&>p]:mb-2 [&>p:last-child]:mb-0",
                      !isSelected && !showResult && "text-muted-foreground group-hover:text-foreground",
                      isSelected && !showResult && "text-foreground font-medium",
                      showResult && isCorrect && "text-emerald-800 dark:text-emerald-300 font-medium",
                      showResult && wasSelected && !isCorrect && "text-red-700 dark:text-red-300",
                      showResult && !isCorrect && !wasSelected && "text-muted-foreground/50",
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
              onClick={onSubmit}
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
                  result.isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white",
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

            {/* Next / Finish button */}
            <div className="flex justify-end">
              <Button
                onClick={onNext}
                className="rounded-xl px-6 h-10 text-sm font-semibold"
              >
                {isLastQuestion ? (
                  <>
                    {result.isCorrect ? "See results" : "Finish quiz"}
                    <Trophy className="h-3.5 w-3.5 ml-2" />
                  </>
                ) : (
                  <>
                    Next question
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
