import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Loader2, X, BrainCircuit, Check, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

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
      setQuestions(initialQuestions.map(q => ({ ...q, id: crypto.randomUUID() })));
    }
  }, [isOpen, initialQuestions]);

  if (!isOpen) return null;

  const updateQuestion = (index: number, field: keyof DraftQuestion, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateAnswer = (qIndex: number, aIndex: number, field: keyof DraftAnswer, value: string | boolean) => {
    const updated = [...questions];
    const updatedAnswers = [...updated[qIndex].answers];
    
    if (field === "isCorrect") {
      // Uncheck all others
      updatedAnswers.forEach((a, i) => {
        a.isCorrect = i === aIndex;
      });
    } else {
      updatedAnswers[aIndex] = { ...updatedAnswers[aIndex], [field]: value as string };
    }
    
    updated[qIndex].answers = updatedAnswers;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Basic validation
    const valid = questions.every(q => 
      q.content.trim().length > 0 && 
      q.answers.some(a => a.isCorrect) && 
      q.answers.every(a => a.content.trim().length > 0)
    );
    
    if (!valid) {
      alert("Please ensure all questions have content, at least one correct answer, and all options are filled.");
      return;
    }
    
    await onSave(questions);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors disabled:opacity-50 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 pb-6 border-b border-border/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Review Generated Questions
              </h2>
              <p className="text-sm text-muted-foreground font-serif mt-1">
                Edit or remove any questions before adding them to your quiz.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-serif italic">
              No questions remaining. You can close this modal.
            </div>
          ) : (
            questions.map((q, qIndex) => (
              <div key={q.id} className="p-6 border border-border rounded-2xl bg-secondary/20 relative group">
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove this question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Question {qIndex + 1}
                    </Label>
                    <textarea
                      value={q.content}
                      onChange={(e) => updateQuestion(qIndex, "content", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 font-serif"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Hint (Optional)
                    </Label>
                    <Input
                      value={q.hint || ""}
                      onChange={(e) => updateQuestion(qIndex, "hint", e.target.value)}
                      className="font-serif italic bg-background"
                      placeholder="Add a helpful hint..."
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Answer Options
                    </Label>
                    <div className="space-y-2">
                      {q.answers.map((answer, aIndex) => (
                        <div key={aIndex} className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant={answer.isCorrect ? "default" : "outline"}
                            size="icon"
                            onClick={() => updateAnswer(qIndex, aIndex, "isCorrect", true)}
                            className={cn(
                              "h-9 w-9 shrink-0 rounded-lg transition-all",
                              answer.isCorrect ? "shadow-sm shadow-primary/20" : "hover:border-primary/40 text-muted-foreground"
                            )}
                            title="Mark as correct"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Input
                            value={answer.content}
                            onChange={(e) => updateAnswer(qIndex, aIndex, "content", e.target.value)}
                            className="bg-background"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-border/40 shrink-0 bg-card flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {questions.length} question(s) ready to save.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-full px-6"
            >
              Discard All
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || questions.length === 0}
              className="rounded-full px-8 gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save to Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
