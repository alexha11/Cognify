"use client";

import { useEffect, useState } from "react";
import { Button } from "./button";
import { Input, Textarea } from "./input";
import { Label } from "./label";
import { Modal } from "./modal";
import { Check, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "./toast";

export interface DraftAnswer {
  content: string;
  isCorrect: boolean;
}

export interface DraftQuestion {
  id?: string; // local id for rendering
  content: string;
  hint?: string;
  answers: DraftAnswer[];
}

interface DraftQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: DraftQuestion[];
  onSave: (questions: DraftQuestion[]) => Promise<void>;
  isSaving: boolean;
}

export function DraftQuestionsModal({
  isOpen,
  onClose,
  questions: initialQuestions,
  onSave,
  isSaving,
}: DraftQuestionsModalProps) {
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  // Synchronize internal state when the modal opens with new questions
  useEffect(() => {
    if (isOpen) {
      setQuestions(
        initialQuestions.map((q) => ({ ...q, id: crypto.randomUUID() })),
      );
    }
  }, [isOpen, initialQuestions]);

  const updateQuestion = (
    index: number,
    field: keyof DraftQuestion,
    value: string,
  ) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateAnswer = (
    qIndex: number,
    aIndex: number,
    field: keyof DraftAnswer,
    value: string | boolean,
  ) => {
    const updated = [...questions];
    const updatedAnswers = [...updated[qIndex].answers];

    if (field === "isCorrect") {
      // Uncheck all others
      updatedAnswers.forEach((a, i) => {
        a.isCorrect = i === aIndex;
      });
    } else {
      updatedAnswers[aIndex] = {
        ...updatedAnswers[aIndex],
        [field]: value as string,
      };
    }

    updated[qIndex].answers = updatedAnswers;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Basic validation
    const valid = questions.every((q) =>
      q.content.trim().length > 0 &&
      q.answers.some((a) => a.isCorrect) &&
      q.answers.every((a) => a.content.trim().length > 0)
    );

    if (!valid) {
      toast.error(
        "Every question needs content, one correct answer, and no empty options.",
      );
      return;
    }

    await onSave(questions);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Review generated questions"
      description="Edit or remove any questions before adding them to your quiz."
      size="xl"
      dismissable={!isSaving}
      footer={
        <>
          <p className="mr-auto hidden text-sm text-muted-foreground sm:block">
            {questions.length} question{questions.length === 1 ? "" : "s"} ready
            to save.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Discard all
          </Button>
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={questions.length === 0}
          >
            {!isSaving && <Save />}
            Save to quiz
          </Button>
        </>
      }
    >
      {questions.length === 0
        ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No questions remaining. You can close this dialog.
          </p>
        )
        : (
          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div
                key={q.id}
                className="relative space-y-4 rounded-md border border-border bg-surface-sunken p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <Label>Question {qIndex + 1}</Label>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeQuestion(qIndex)}
                    aria-label={`Remove question ${qIndex + 1}`}
                    className="-mr-1 text-muted-foreground hover:text-error"
                  >
                    <Trash2 />
                  </Button>
                </div>

                <Textarea
                  value={q.content}
                  onChange={(e) =>
                    updateQuestion(qIndex, "content", e.target.value)}
                  rows={2}
                  aria-label={`Question ${qIndex + 1} content`}
                />

                <div className="space-y-2">
                  <Label htmlFor={`hint-${q.id}`}>Hint (optional)</Label>
                  <Input
                    id={`hint-${q.id}`}
                    value={q.hint || ""}
                    onChange={(e) =>
                      updateQuestion(qIndex, "hint", e.target.value)}
                    placeholder="Add a helpful hint…"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Answer options</Label>
                  <div className="space-y-2">
                    {q.answers.map((answer, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateAnswer(qIndex, aIndex, "isCorrect", true)}
                          aria-pressed={answer.isCorrect}
                          aria-label={`Mark option ${
                            String.fromCharCode(65 + aIndex)
                          } as correct`}
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                            answer.isCorrect
                              ? "border-success bg-success text-success-foreground"
                              : "border-border-strong bg-surface text-subtle-foreground hover:border-success hover:text-success",
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <Input
                          value={answer.content}
                          onChange={(e) =>
                            updateAnswer(
                              qIndex,
                              aIndex,
                              "content",
                              e.target.value,
                            )}
                          aria-label={`Option ${
                            String.fromCharCode(65 + aIndex)
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </Modal>
  );
}
