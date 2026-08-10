"use client";

import { useState } from "react";
import { Question } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Check, X, Loader2 } from "lucide-react";
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

  const [prevQuestionId, setPrevQuestionId] = useState<string | null>(question?.id || null);

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

  if (!isOpen || !question) return null;

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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full shadow-xl border-border/50 animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="p-6 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Edit question</CardTitle>
              <CardDescription className="text-xs">
                Update question content, hint, and answer options.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="questionText" className="text-xs font-medium text-muted-foreground">
                Question text
              </Label>
              <textarea
                id="questionText"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground leading-relaxed placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionHint" className="text-xs font-medium text-muted-foreground">
                Hint (optional)
              </Label>
              <Input
                id="questionHint"
                value={form.hint}
                onChange={(e) => setForm({ ...form, hint: e.target.value })}
                className="rounded-xl text-sm h-10"
                placeholder="Add a hint..."
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">Answer options</Label>
              <div className="space-y-2">
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
                      className={cn(
                        "h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg border transition-all duration-150",
                        answer.isCorrect
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                          : "bg-background border-border text-muted-foreground/30 hover:border-emerald-400 hover:text-emerald-600"
                      )}
                      title="Mark as correct"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <Input
                      value={answer.content}
                      onChange={(e) => {
                        const updated = [...form.answers];
                        updated[index].content = e.target.value;
                        setForm({ ...form, answers: updated });
                      }}
                      className="rounded-xl text-sm h-9 flex-1"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-border/40 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="rounded-xl font-semibold">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
