import { useState, useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Loader2, X, UploadCloud, File, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerateQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: { file: File; topic: string; count: number; difficulty: string }) => Promise<void>;
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

  if (!isOpen) return null;

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
        alert("Please upload a PDF file.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !topic) return;
    await onGenerate({ file, topic, count, difficulty });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 pb-6 border-b border-border/40 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Generate with AI
            </h2>
            <p className="text-sm text-muted-foreground font-serif mt-1">
              Upload a PDF material to auto-generate exam questions.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Course Material (PDF)
            </Label>
            <div
              onClick={() => !isGenerating && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer",
                file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-secondary/30",
                isGenerating && "opacity-50 cursor-not-allowed"
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
              {file ? (
                <>
                  <File className="h-8 w-8 text-primary/80" />
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground font-serif">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-2">
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Click or drag & drop</p>
                  <p className="text-xs text-muted-foreground font-serif">PDF files up to 10MB</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="topic" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Focus Area / Topic
            </Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Backpropagation in Neural Networks"
              className="h-12 rounded-xl"
              disabled={isGenerating}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="count" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Number of Questions
              </Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                className="h-12 rounded-xl"
                disabled={isGenerating}
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="difficulty" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Difficulty Level
              </Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={isGenerating}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
              className="rounded-full px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isGenerating || !file || !topic}
              className="rounded-full px-8 gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BrainCircuit className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
