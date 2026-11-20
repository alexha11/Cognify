import type { AttemptResult, CheckAnswerResult } from "@/types";

/**
 * Turns a guest grading result (POST /questions/:id/check) into the shape the
 * quiz UI already renders for signed-in attempts.
 */
export function toAttemptResult(checked: CheckAnswerResult): AttemptResult {
  return {
    id: "guest",
    isCorrect: checked.isCorrect,
    selectedAnswerIds: checked.selectedAnswerIds,
    correctAnswerIds: checked.correctAnswerIds,
    hint: checked.hint ?? undefined,
    question: checked.question,
  };
}

export interface QuizScore {
  correct: number;
  incorrect: number;
  total: number;
  answered: number;
  percentage: number;
}

/**
 * Score for one course's quiz from a map of questionId → correct?. Only the
 * given questions count, so attempts from other courses are ignored.
 */
export function summarizeQuizScore(
  questionIds: string[],
  results: Record<string, boolean>,
): QuizScore {
  const total = questionIds.length || 1;
  let correct = 0;
  let answered = 0;

  for (const id of questionIds) {
    if (results[id] !== undefined) {
      answered++;
      if (results[id]) correct++;
    }
  }

  return {
    correct,
    incorrect: Math.max(0, total - correct),
    total,
    answered,
    percentage: Math.min(100, Math.round((correct / total) * 100)),
  };
}
