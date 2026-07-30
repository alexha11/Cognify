"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenerateQuestionsModal, DraftQuestionsModal } from "@/components/ui";
import type { DraftQuestion } from "@/components/ui";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Check,
  X,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  Loader2,
  BrainCircuit,
  Pencil,
  ImagePlus,
  Image as ImageIcon,
  Type,
  Upload,
} from "lucide-react";

interface Answer {
  id?: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  content: string;
  hint?: string;
  contentType?: 'text' | 'image';
  imageUrl?: string;
  courseId: string;
  createdById?: string;
  answers: Answer[];
  approved: boolean;
  aiGenerated: boolean;
}

interface Course {
  id: string;
  name: string;
  createdById?: string;
}

export default function QuestionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isSavingDrafts, setIsSavingDrafts] = useState(false);

  const [newQuestion, setNewQuestion] = useState({ content: "", hint: "" });
  const [newAnswers, setNewAnswers] = useState<Answer[]>([
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
  ]);
  const [questionType, setQuestionType] = useState<'text' | 'image'>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const canManageSelectedCourse = () => {
    if (user?.role === "ADMIN") return true;
    if (!user?.id || !selectedCourse) return false;
    const currentCourse = courses.find((c) => c.id === selectedCourse);
    return currentCourse?.createdById === user.id;
  };

  const canManageQuestion = (q: Question) => {
    if (user?.role === "ADMIN") return true;
    if (!user?.id) return false;
    const currentCourse = courses.find((c) => c.id === selectedCourse);
    return q.createdById === user.id || currentCourse?.createdById === user.id;
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (authLoading || !user) return;
      try {
        const data = await apiGet<Course[]>("/courses");
        setCourses(data || []);
        if (data && data.length > 0) setSelectedCourse(data[0].id);
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [authLoading, user]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedCourse) return;
      try {
        setIsLoading(true);
        const data = await apiGet<Question[]>(
          `/questions/course/${selectedCourse}`,
        );
        setQuestions(data || []);
      } catch (error) {
        console.error("Failed to fetch questions", error);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [selectedCourse]);

  const addAnswer = () => {
    if (newAnswers.length < 6)
      setNewAnswers([...newAnswers, { content: "", isCorrect: false }]);
  };

  const removeAnswer = (index: number) => {
    if (newAnswers.length > 2) {
      const updated = newAnswers.filter((_, i) => i !== index);
      if (!updated.some((a) => a.isCorrect) && updated.length > 0)
        updated[0].isCorrect = true;
      setNewAnswers(updated);
    }
  };

  const updateAnswer = (
    index: number,
    field: keyof Answer,
    value: string | boolean,
  ) => {
    const updated = [...newAnswers];
    if (field === "isCorrect")
      updated[index].isCorrect = !updated[index].isCorrect;
    else if (field === "content") updated[index].content = value as string;
    setNewAnswers(updated);
  };

  const handleGenerateQuestions = async ({
    file,
    topic,
    count,
    difficulty,
  }: {
    file: File;
    topic: string;
    count: number;
    difficulty: string;
  }) => {
    if (!selectedCourse) {
      toast.error("Please select a course first");
      return;
    }
    setIsGeneratingAi(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", selectedCourse);
      const material = await apiUpload<{ id: string }>(
        "/materials/upload",
        formData,
      );
      const response = await apiPost<{
        message: string;
        questions: DraftQuestion[];
      }>("/ai/generate-questions", {
        courseId: selectedCourse,
        materialId: material.id,
        topic,
        count,
        difficulty,
      });
      toast.success(response.message || "Questions successfully generated!");
      setIsGenerateModalOpen(false);
      setDraftQuestions(response.questions || []);
      setIsDraftModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveDrafts = async (questionsToSave: DraftQuestion[]) => {
    if (!selectedCourse) return;
    setIsSavingDrafts(true);
    try {
      const payload = questionsToSave.map((q) => ({
        content: q.content,
        hint: q.hint || undefined,
        courseId: selectedCourse,
        answers: q.answers,
      }));
      await apiPost("/questions/bulk", { questions: payload });
      toast.success(
        `Successfully added ${questionsToSave.length} questions to the course!`,
      );
      setIsDraftModalOpen(false);
      setDraftQuestions([]);
      const data = await apiGet<Question[]>(
        `/questions/course/${selectedCourse}`,
      );
      setQuestions(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save draft questions. Please try again.");
    } finally {
      setIsSavingDrafts(false);
    }
  };

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }
    if (questionType === 'text' && newQuestion.content.length < 10) {
      setError("Question must be at least 10 characters");
      return;
    }
    if (questionType === 'image' && !imageFile && !editingQuestion?.imageUrl) {
      setError("Please upload an image for the question");
      return;
    }
    if (!newAnswers.some((a) => a.isCorrect)) {
      setError("Please mark at least one answer as correct");
      return;
    }
    if (newAnswers.some((a) => !a.content.trim())) {
      setError("All answers must have content");
      return;
    }

    setCreating(true);
    setError("");
    try {
      if (editingQuestion) {
        await apiPut(`/questions/${editingQuestion.id}`, {
          content: newQuestion.content || editingQuestion.content,
          hint: newQuestion.hint || undefined,
          contentType: questionType,
          answers: newAnswers,
        });
      } else if (questionType === 'image' && imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('courseId', selectedCourse);
        formData.append('answers', JSON.stringify(newAnswers));
        if (newQuestion.hint) formData.append('hint', newQuestion.hint);
        if (newQuestion.content) formData.append('content', newQuestion.content);
        await apiUpload('/questions/upload-image', formData);
      } else {
        await apiPost("/questions", {
          content: newQuestion.content,
          hint: newQuestion.hint || undefined,
          courseId: selectedCourse,
          answers: newAnswers,
        });
      }
      closeModal();
      const data = await apiGet<Question[]>(
        `/questions/course/${selectedCourse}`,
      );
      setQuestions(data || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to save question");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await apiDelete(`/questions/${questionId}`);
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error("Failed to delete question", err);
    }
  };

  const handleEditClick = (q: Question) => {
    setEditingQuestion(q);
    setNewQuestion({ content: q.content, hint: q.hint || "" });
    setNewAnswers(
      q.answers.map((a) => ({
        id: a.id,
        content: a.content,
        isCorrect: a.isCorrect,
      })),
    );
    setQuestionType(q.contentType === 'image' ? 'image' : 'text');
    if (q.imageUrl) setImagePreview(q.imageUrl);
    setShowCreate(true);
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditingQuestion(null);
    setNewQuestion({ content: "", hint: "" });
    setNewAnswers([
      { content: "", isCorrect: true },
      { content: "", isCorrect: false },
    ]);
    setQuestionType('text');
    setImageFile(null);
    setImagePreview(null);
    setError("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Question bank
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage and review questions for your courses.
            </p>
          </div>
          {canManageSelectedCourse() && (
            <div className="flex gap-2.5">
              <Button
                onClick={() => setShowCreate(true)}
                variant="outline"
                className="rounded-xl gap-2 h-9 px-4 text-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add manually
              </Button>
              <Button
                onClick={() => {
                  if (!selectedCourse) {
                    toast.error("Please select a course first");
                    return;
                  }
                  setIsGenerateModalOpen(true);
                }}
                className="rounded-xl gap-2 h-9 px-4 text-sm font-semibold"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                Generate with AI
              </Button>
            </div>
          )}
        </div>

        {/* ── Course selector ── */}
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card shadow-sm">
          <label
            htmlFor="courseKey"
            className="text-sm font-medium text-muted-foreground whitespace-nowrap"
          >
            Course
          </label>
          <div className="relative flex-1">
            <select
              id="courseKey"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          {questions.length > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {questions.length} questions
            </span>
          )}
        </div>

        {/* ── Questions list ── */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : questions.length === 0 ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-12 text-center">
              <HelpCircle className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">
                {selectedCourse ? "No questions yet" : "Select a course"}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedCourse
                  ? "Add your first question to get started."
                  : "Choose a course above to see its questions."}
              </p>
              {canManageSelectedCourse() && selectedCourse && (
                <Button
                  onClick={() => setShowCreate(true)}
                  variant="outline"
                  className="mt-5 rounded-xl"
                >
                  Add question
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <Card
                key={question.id}
                className="group border-border/50 hover:border-border shadow-sm transition-all duration-150 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Index badge */}
                    <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-muted border border-border/60 text-xs font-semibold text-muted-foreground mt-0.5 group-hover:border-primary/30 group-hover:text-primary transition-colors duration-150">
                      {index + 1}
                    </span>

                    <div className="flex-1 min-w-0 space-y-4">
                      {/* Meta badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {question.aiGenerated && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                            <BrainCircuit className="h-3 w-3" />
                            AI generated
                          </span>
                        )}
                        {!question.approved && (
                          <span className="inline-flex items-center text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/25 border border-amber-300/60 dark:border-amber-700/50 px-2.5 py-0.5 rounded-full">
                            Pending review
                          </span>
                        )}
                      </div>

                      {/* Question content: image or text */}
                      {question.contentType === 'image' && question.imageUrl ? (
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-200/60 dark:border-indigo-700/50 px-2 py-0.5 rounded-full">
                            <ImageIcon className="h-3 w-3" />
                            Image question
                          </span>
                          <img
                            src={question.imageUrl}
                            alt={question.content}
                            className="max-h-48 rounded-xl border border-border/50 object-contain bg-muted/20"
                            loading="lazy"
                          />
                          {question.content && (
                            <p className="text-xs text-muted-foreground">{question.content}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {question.content}
                        </p>
                      )}

                      {/* Hint */}
                      {question.hint && (
                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/40">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {question.hint}
                          </p>
                        </div>
                      )}

                      {/* Answer options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {question.answers.map((answer, i) => (
                          <div
                            key={answer.id || i}
                            className={cn(
                              "flex items-center gap-2.5 p-3 rounded-xl border text-xs transition-colors",
                              answer.isCorrect
                                ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-300/60 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300"
                                : "bg-background border-border/50 text-muted-foreground",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold border",
                                answer.isCorrect
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "bg-background border-border text-muted-foreground",
                              )}
                            >
                              {answer.isCorrect ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                String.fromCharCode(65 + i)
                              )}
                            </span>
                            <span className="leading-relaxed flex-1">
                              {answer.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {canManageQuestion(question) && (
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(question)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                          title="Edit question"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(question.id)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/25"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full shadow-xl border-border/50 animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="p-6 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-semibold">
                    {editingQuestion ? "Edit question" : "Add question"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {editingQuestion
                      ? "Update the question and its answers."
                      : "Add a new question for this course."}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeModal}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/25 border border-red-300/60 dark:border-red-700/50 text-xs font-medium text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* Question Type selector */}
                {!editingQuestion && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Question format
                    </Label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-xl border border-border/50">
                      <button
                        type="button"
                        onClick={() => setQuestionType("text")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                          questionType === "text"
                            ? "bg-background text-foreground shadow-sm border border-border/50 font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Type className="w-3.5 h-3.5" />
                        Text Question
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestionType("image")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                          questionType === "image"
                            ? "bg-background text-foreground shadow-sm border border-border/50 font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Image Question
                      </button>
                    </div>
                  </div>
                )}

                {/* Question content based on format */}
                {questionType === "text" ? (
                  <div className="space-y-2">
                    <Label
                      htmlFor="questionContent"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Question
                    </Label>
                    <textarea
                      id="questionContent"
                      value={newQuestion.content}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          content: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground leading-relaxed placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
                      placeholder="Enter your question…"
                      required
                      minLength={10}
                    />
                    <div className="flex justify-end">
                      <span className="text-[10px] text-muted-foreground/50">
                        {newQuestion.content.length} characters
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Upload Image
                      </Label>
                      {imagePreview ? (
                        <div className="relative rounded-xl border border-border overflow-hidden bg-muted/10 p-2 group">
                          <img
                            src={imagePreview}
                            alt="Question preview"
                            className="max-h-48 w-full object-contain rounded-lg"
                          />
                          {!editingQuestion && (
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                              }}
                              className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/80 hover:bg-background border border-border text-foreground shadow-sm transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-primary/5 cursor-pointer transition-all">
                          <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-medium text-foreground">
                              Click or drag image to upload
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              PNG, JPG, WEBP, GIF up to 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageSelect(file);
                            }}
                          />
                        </label>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="imageCaption"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Caption / Description{" "}
                        <span className="text-muted-foreground/50 font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="imageCaption"
                        value={newQuestion.content}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            content: e.target.value,
                          })
                        }
                        className="rounded-xl text-sm h-10"
                        placeholder="e.g. What does this diagram represent?"
                      />
                    </div>
                  </div>
                )}

                {/* Hint */}
                <div className="space-y-2">
                  <Label
                    htmlFor="hintContent"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Hint{" "}
                    <span className="text-muted-foreground/50 font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="hintContent"
                    value={newQuestion.hint}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, hint: e.target.value })
                    }
                    className="rounded-xl text-sm h-10"
                    placeholder="Add a hint to guide students…"
                  />
                </div>

                {/* Answer options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Answer options
                    </Label>
                    {newAnswers.length < 6 && (
                      <button
                        type="button"
                        onClick={addAnswer}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        + Add option
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {newAnswers.map((answer, index) => (
                      <div key={index} className="flex items-center gap-2.5">
                        {/* Correct toggle */}
                        <button
                          type="button"
                          onClick={() => updateAnswer(index, "isCorrect", true)}
                          title="Mark as correct"
                          className={cn(
                            "h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg border transition-all duration-150",
                            answer.isCorrect
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                              : "bg-background border-border text-muted-foreground/30 hover:border-emerald-400 hover:text-emerald-600",
                          )}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        {/* Answer text */}
                        <Input
                          value={answer.content}
                          onChange={(e) =>
                            updateAnswer(index, "content", e.target.value)
                          }
                          className="flex-1 rounded-xl text-sm h-10"
                          placeholder={`Option ${String.fromCharCode(65 + index)}…`}
                          required
                        />

                        {/* Remove */}
                        {newAnswers.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeAnswer(index)}
                            className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-muted-foreground/50">
                    Click the check button to mark the correct answer(s).
                  </p>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-4 border-t border-border/40 bg-muted/10 flex items-center justify-end gap-2.5 rounded-b-xl">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
                  className="rounded-xl h-9 px-4 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl h-9 px-5 text-sm font-semibold gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      {editingQuestion ? "Save changes" : "Save question"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <GenerateQuestionsModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={handleGenerateQuestions}
        isGenerating={isGeneratingAi}
      />
      <DraftQuestionsModal
        isOpen={isDraftModalOpen}
        onClose={() => {
          if (
            confirm(
              "Are you sure you want to discard these generated questions?",
            )
          )
            setIsDraftModalOpen(false);
        }}
        questions={draftQuestions}
        onSave={handleSaveDrafts}
        isSaving={isSavingDrafts}
      />
    </DashboardLayout>
  );
}
