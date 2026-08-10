"use client";

import { useState } from "react";
import { Question } from "@/types";
import { Modal } from "./modal";
import { Button } from "./button";
import { Input, Textarea } from "./input";
import { Label } from "./label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "./toast";

interface EditQuestionModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    content: string;
    hint?: string;
    answers: { id?: string; content: string; isCorrect: boolean }[];
  }) => Promise<void>;
  isSaving: boolean;
}

export function EditQuestionModal({
  question,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: EditQuestionModalProps) {
  const [form, setForm] = useState(() => ({
    content: question?.content || "",
    hint: question?.hint || "",
    answers: question?.answers.map((a) => ({
      id: a.id,
      content: a.content,
      isCorrect: a.isCorrect,
    })) || [],
  }));

  const [prevQuestionId, setPrevQuestionId] = useState<string | null>(
    question?.id || null,
  );

  if (question && question.id !== prevQuestionId) {
    setPrevQuestionId(question.id);
    setForm({
      content: question.content,
      hint: question.hint || "",
      answers: question.answers.map((a) => ({
        id: a.id,
        content: a.content,
        isCorrect: a.isCorrect,
      })),
    });
  }

  if (!question) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.content.length < 5) {
      toast.error("Question content is too short");
      return;
    }
    if (!form.answers.some((a) => a.isCorrect)) {
      toast.error("Please mark at least one answer as correct");
      return;
    }
    if (form.answers.some((a) => !a.content.trim())) {
      toast.error("All options must have text content");
      return;
    }
    await onSave({
      content: form.content,
      hint: form.hint || undefined,
      answers: form.answers,
    });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Edit question"
      description="Update question content, hint, and answer options."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-question-form" loading={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <form
        id="edit-question-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="questionText">Question text</Label>
          <Textarea
            id="questionText"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="questionHint">Hint (optional)</Label>
          <Input
            id="questionHint"
            value={form.hint}
            onChange={(e) => setForm({ ...form, hint: e.target.value })}
            placeholder="Add a hint…"
          />
        </div>

        <div className="space-y-2">
          <Label>Answer options</Label>
          <p className="text-sm text-muted-foreground">
            Select the check to mark the correct answer.
          </p>
          <div className="space-y-2 pt-1">
            {form.answers.map((answer, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const updated = form.answers.map((a, i) => ({
                      ...a,
                      isCorrect: i === index,
                    }));
                    setForm({ ...form, answers: updated });
                  }}
                  aria-pressed={answer.isCorrect}
                  aria-label={`Mark option ${
                    String.fromCharCode(65 + index)
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
                  onChange={(e) => {
                    const updated = [...form.answers];
                    updated[index] = {
                      ...updated[index],
                      content: e.target.value,
                    };
                    setForm({ ...form, answers: updated });
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  required
                />
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
