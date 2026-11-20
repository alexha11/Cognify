import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AttemptResult, Question } from "@/types";
import { QuizCard } from "./quiz-card";

// What a learner receives: options without `isCorrect`.
const question: Question = {
  id: "q1",
  content: "What is 2 + 2?",
  courseId: "c1",
  aiGenerated: false,
  approved: true,
  createdAt: "2026-11-20T00:00:00.000Z",
  answers: [
    { id: "a1", content: "Four" },
    { id: "a2", content: "Five" },
  ],
};

const renderCard = (
  props: Partial<React.ComponentProps<typeof QuizCard>> = {},
) => {
  const handlers = {
    onToggleAnswer: vi.fn(),
    onSubmit: vi.fn(),
    onNext: vi.fn(),
  };
  render(
    <QuizCard
      question={question}
      questionNumber={1}
      totalQuestions={3}
      selectedAnswers={[]}
      result={null}
      isLastQuestion={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

describe("QuizCard", () => {
  it("lets the learner pick an option and check it", async () => {
    const user = userEvent.setup();
    const { onToggleAnswer, onSubmit } = renderCard({ selectedAnswers: ["a1"] });

    expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
    await user.click(screen.getByText("Five"));
    expect(onToggleAnswer).toHaveBeenCalledWith("a2");

    await user.click(screen.getByRole("button", { name: /check answer/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("cannot be checked before an option is chosen", () => {
    renderCard();
    expect(screen.getByRole("button", { name: /check answer/i })).toBeDisabled();
  });

  it("shows the server's verdict and hint after answering", () => {
    const result: AttemptResult = {
      id: "guest",
      isCorrect: false,
      selectedAnswerIds: ["a2"],
      correctAnswerIds: ["a1"],
      hint: "Count on your fingers.",
      question: { id: "q1", content: "What is 2 + 2?" },
    };

    renderCard({ selectedAnswers: ["a2"], result });

    expect(screen.getByText("Not quite right.")).toBeInTheDocument();
    expect(screen.getByText("Count on your fingers.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /check answer/i }),
    ).not.toBeInTheDocument();
  });
});
