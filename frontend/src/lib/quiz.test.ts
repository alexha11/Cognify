import { describe, expect, it } from "vitest";
import { summarizeQuizScore, toAttemptResult } from "./quiz";

describe("toAttemptResult", () => {
  it("maps a guest grading result onto the attempt shape the quiz renders", () => {
    expect(
      toAttemptResult({
        isCorrect: false,
        selectedAnswerIds: ["a2"],
        correctAnswerIds: ["a1"],
        hint: null,
        question: { id: "q1", content: "2 + 2?" },
      }),
    ).toEqual({
      id: "guest",
      isCorrect: false,
      selectedAnswerIds: ["a2"],
      correctAnswerIds: ["a1"],
      hint: undefined,
      question: { id: "q1", content: "2 + 2?" },
    });
  });
});

describe("summarizeQuizScore", () => {
  it("counts only this quiz's questions", () => {
    const score = summarizeQuizScore(["q1", "q2", "q3", "q4"], {
      q1: true,
      q2: false,
      q3: true,
      "other-course": true,
    });

    expect(score).toEqual({
      correct: 2,
      incorrect: 2,
      total: 4,
      answered: 3,
      percentage: 50,
    });
  });

  it("never divides by zero for an empty quiz", () => {
    expect(summarizeQuizScore([], {})).toMatchObject({
      total: 1,
      percentage: 0,
    });
  });
});
