"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { Alert } from "./alert";
import { Button } from "./button";
import { Input, Textarea } from "./input";
import { Label } from "./label";
import { Switch } from "./switch";
import { useLanguage } from "@/lib/i18n";

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: { name: string; description: string; isPublic: boolean },
  ) => Promise<void>;
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

  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setName(initialData.name);
    setDescription(initialData.description || "");
    setIsPublic(initialData.isPublic);
    setError("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Course name is required");
      return;
    }
    setError("");
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || "Failed to update course");
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Edit course"
      description="Update course information and settings"
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {c.cancel}
          </Button>
          {/* Lives outside the <form>, so it submits via form= instead of
              being a descendant submit button. */}
          <Button type="submit" form="edit-course-form" loading={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="edit-course-form" onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="space-y-2">
          <Label htmlFor="edit-course-name">{c.courseName}</Label>
          <Input
            id="edit-course-name"
            placeholder={c.nameplaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-course-desc">{c.description}</Label>
          <Textarea
            id="edit-course-desc"
            placeholder={c.descPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-sunken p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {c.visibility}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isPublic ? c.publicDesc : c.privateDesc}
            </p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={setIsPublic}
            label={c.visibility}
          />
        </div>
      </form>
    </Modal>
  );
}
