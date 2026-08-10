"use client";

import { useRef, useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Select } from "./select";
import { BrainCircuit, File, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "./toast";

interface GenerateQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    data: { file: File; topic: string; count: number; difficulty: string },
  ) => Promise<void>;
  isGenerating: boolean;
}

export function GenerateQuestionsModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: GenerateQuestionsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState("MEDIUM");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast.error("Please upload a PDF file.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !topic) return;
    await onGenerate({ file, topic, count, difficulty });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Generate with AI"
      description="Upload a PDF material to auto-generate exam questions."
      size="md"
      dismissable={!isGenerating}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="generate-questions-form"
            loading={isGenerating}
            disabled={!file || !topic}
          >
            {!isGenerating && <BrainCircuit />}
            {isGenerating ? "Generating…" : "Generate"}
          </Button>
        </>
      }
    >
      <form
        id="generate-questions-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="material-upload">Course material (PDF)</Label>
          <button
            id="material-upload"
            type="button"
            onClick={() => !isGenerating && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            disabled={isGenerating}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              file
                ? "border-primary bg-primary-subtle"
                : "border-border-strong hover:border-primary hover:bg-surface-hover",
              isGenerating && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
              disabled={isGenerating}
            />
            {file
              ? (
                <>
                  <File className="h-7 w-7 text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              )
              : (
                <>
                  <UploadCloud className="h-7 w-7 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Click or drag &amp; drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF files up to 10MB
                  </p>
                </>
              )}
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Focus area / topic</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Backpropagation in neural networks"
            disabled={isGenerating}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="count">Number of questions</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              disabled={isGenerating}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty level</Label>
            <Select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isGenerating}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </Select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
