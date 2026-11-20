/** An answer option as learners may see it before answering: no `isCorrect`. */
export interface PublicAnswer {
  id: string;
  content: string;
}

/**
 * Removes the answer key from a question. Use this for every response that
 * reaches someone who cannot manage the course: learners find out which
 * option was right only after submitting (POST /attempts or
 * POST /questions/:id/check), one question at a time.
 */
export function stripAnswerKey<
  Q extends { answers: ReadonlyArray<{ id: string; content: string }> },
>(question: Q): Omit<Q, 'answers'> & { answers: PublicAnswer[] } {
  return {
    ...question,
    answers: question.answers.map(({ id, content }) => ({ id, content })),
  };
}
