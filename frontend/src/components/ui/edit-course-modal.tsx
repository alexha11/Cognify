"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { X, Loader2, BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; isPublic: boolean }) => Promise<void>;
  initialData: {
    name: string;
    description?: string;
    isPublic: boolean;
  };
  isSaving?: boolean;
}

export function EditCourseModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving = false,
}: EditCourseModalProps) {
  const { t } = useLanguage();
  const c = t.courses;

  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description || "");
  const [isPublic, setIsPublic] = useState(initialData.isPublic);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(initialData.name);
    setDescription(initialData.description || "");
    setIsPublic(initialData.isPublic);
    setError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Course name is required");
      return;
    }
    setError("");
    try {
      await onSave({ name: name.trim(), description: description.trim(), isPublic });
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || "Failed to update course");
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full shadow-xl border-border/50 animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="p-6 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Edit Course</CardTitle>
                <CardDescription className="text-xs">
                  Update course information and settings
                </CardDescription>
              </div>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/25 border border-red-300/60 dark:border-red-700/50 text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-course-name" className="text-xs font-medium text-muted-foreground">
              {c.courseName}
            </Label>
            <Input
              id="edit-course-name"
              placeholder={c.nameplaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl text-sm h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-course-desc" className="text-xs font-medium text-muted-foreground">
              {c.description}
            </Label>
            <textarea
              id="edit-course-desc"
              placeholder={c.descPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
            <div>
              <p className="text-sm font-semibold text-foreground">{c.visibility}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublic ? c.publicDesc : c.privateDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isPublic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              {c.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl font-semibold"
            >
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
