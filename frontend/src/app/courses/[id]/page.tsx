"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { Course, Question, Material, QuizProgress, CourseProgress } from "@/types";
import { cn, formatDate, formatFileSize } from "@/lib/utils";
import {
  ArrowLeft,
  FileQuestion,
  FileText,
  Upload,
  Sparkles,
  Check,
  X,
  Loader2,
  Play,
  Lock,
  ArrowRight,
  Share2,
  Globe,
  BrainCircuit,
  Trophy,
  RefreshCw,
} from "lucide-react";
import {
  FeatureGate,
  AuthPromptModal,
  GenerateQuestionsModal,
  DraftQuestionsModal,
} from "@/components/ui";
import type { DraftQuestion } from "@/components/ui";
import { toast } from "@/components/ui/toast";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [quizProgress, setQuizProgress] = useState<QuizProgress | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isSavingDrafts, setIsSavingDrafts] = useState(false);

  const handleShareLink = () => {
    const url = `${window.location.origin}/quiz/share/${params.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const canEdit = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";
  const isStudent = user?.role === "STUDENT";

  const fetchCourse = async () => {
    if (authLoading) return;
    try {
      const [courseData, questionsData, materialsData] = await Promise.all([
        apiGet<Course>(`/courses/${params.id}`),
        apiGet<Question[]>(`/questions/course/${params.id}`),
        apiGet<Material[]>(`/materials/course/${params.id}`),
      ]);
      setCourse(courseData);
      setQuestions(questionsData || []);
      setMaterials(materialsData || []);

      if (user) {
        const [progressData, cProgressData] = await Promise.all([
          apiGet<QuizProgress>(`/attempts/progress/${params.id}`).catch(() => null),
          apiGet<CourseProgress>(`/attempts/course/${params.id}`).catch(() => null),
        ]);
        setQuizProgress(progressData);
        setCourseProgress(cProgressData);
      }
    } catch (error) {
      console.error("Failed to fetch course", error);
      router.push("/courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [params.id, authLoading, user]);

  const handleQuizAction = async () => {
    if (!course) return;
    if (!user) {
      router.push(`/quiz/${course.id}?guest=true`);
      return;
    }

    if (quizProgress?.isCompleted || courseProgress?.isCompleted) {
      try {
        await apiPost(`/attempts/reset/${course.id}`, {});
      } catch (e) {
        console.error("Failed to reset quiz progress", e);
      }
      router.push(`/quiz/${course.id}`);
    } else {
      router.push(`/quiz/${course.id}`);
    }
  };

  const handleApprove = async (questionId: string) => {
    try {
      await apiPost(`/questions/${questionId}/approve`);
      fetchCourse();
    } catch (error) {
      console.error("Failed to approve question", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !course) return;
    setIsUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", course.id);
      await apiUpload<Material>("/materials/upload", formData);
      fetchCourse();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setUploadError(error.response?.data?.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
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
    if (!course) return;
    setIsGeneratingAi(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", course.id);
      const material = await apiUpload<Material>("/materials/upload", formData);
      const response = await apiPost<{
        message: string;
        questions: DraftQuestion[];
      }>("/ai/generate-questions", {
        courseId: course.id,
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
    if (!course) return;
    setIsSavingDrafts(true);
    try {
      const payload = questionsToSave.map((q) => ({
        content: q.content,
        hint: q.hint || undefined,
        courseId: course.id,
        answers: q.answers,
      }));
      await apiPost("/questions/bulk", { questions: payload });
      toast.success(
        `Successfully added ${questionsToSave.length} questions to the course!`,
      );
      setIsDraftModalOpen(false);
      setDraftQuestions([]);
      fetchCourse();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save draft questions. Please try again.");
    } finally {
      setIsSavingDrafts(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) return null;

  const pendingQuestions = questions.filter((q) => !q.approved);
  const approvedQuestions = questions.filter((q) => q.approved);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── Breadcrumb ── */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Cognify
            </Link>
            <span className="opacity-40">/</span>
            <Link
              href="/courses"
              className="hover:text-foreground transition-colors"
            >
              Courses
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {course.name}
            </span>
          </nav>
          <Link href="/courses">
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        </div>

        {/* ── Course header card ── */}
        <Card className="overflow-hidden shadow-sm border-border/50">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border/40">
              {/* Left: course info + CTAs */}
              <div className="p-8 md:p-10 lg:max-w-xl w-full space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge
                      variant={course.isPublic ? "outline" : "secondary"}
                      className={cn(
                        "gap-1.5 text-xs",
                        course.isPublic &&
                          "border-emerald-300/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25",
                      )}
                    >
                      {course.isPublic ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      {course.isPublic ? "Public" : "Private"}
                    </Badge>
                    {canEdit && (
                      <Badge variant="secondary" className="text-xs">
                        Instructor view
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                    {course.name}
                  </h1>

                  {course.description && (
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {(!user || isStudent) && approvedQuestions.length > 0 && (
                    <Button
                      size="default"
                      className="rounded-xl gap-2 px-5 font-semibold"
                      onClick={handleQuizAction}
                    >
                      {!user ||
                      (!quizProgress?.isCompleted &&
                        !courseProgress?.isCompleted &&
                        !quizProgress?.currentIndex &&
                        !courseProgress?.answered) ? (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Start quiz
                        </>
                      ) : quizProgress?.isCompleted || courseProgress?.isCompleted ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Retake quiz
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Continue quiz
                        </>
                      )}
                    </Button>
                  )}
                  {approvedQuestions.length > 0 && (
                    <Button
                      variant="outline"
                      size="default"
                      className="rounded-xl gap-2 px-5"
                      onClick={handleShareLink}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          Link copied!
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                          Share quiz
                        </>
                      )}
                    </Button>
                  )}
                  {approvedQuestions.length > 0 && (
                    <Link href={`/ranking/${course.id}`}>
                      <Button
                        variant="outline"
                        size="default"
                        className="rounded-xl gap-2 px-5"
                      >
                        <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                        Leaderboard
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: stats + pending alert */}
              <div className="flex-1 p-8 md:p-10 bg-muted/10 flex flex-col justify-between gap-8">
                {/* Stat grid */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">
                    Overview
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-background border border-border/50 space-y-1">
                      <p className="text-2xl font-semibold text-foreground tracking-tight">
                        {approvedQuestions.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Questions</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border/50 space-y-1">
                      <p className="text-2xl font-semibold text-foreground tracking-tight">
                        {materials.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Materials</p>
                    </div>
                  </div>
                </div>

                {/* Pending review alert */}
                {canEdit && pendingQuestions.length > 0 && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-300/60 dark:border-amber-700/50">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        {pendingQuestions.length} pending review
                      </p>
                      <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                        Awaiting verification
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-amber-500/50 flex-shrink-0" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Main content + sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ── Left: questions ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending questions */}
            {canEdit && pendingQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">
                    Pending review
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/25 border border-amber-300/60 dark:border-amber-700/50 px-2.5 py-1 rounded-full">
                    {pendingQuestions.length} awaiting
                  </span>
                </div>

                <div className="space-y-3">
                  {pendingQuestions.map((question) => (
                    <Card
                      key={question.id}
                      className="border-amber-200/60 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10 shadow-sm overflow-hidden"
                    >
                      <CardContent className="p-6 space-y-5">
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {question.content}
                        </p>

                        {/* Answers grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {question.answers.map((answer, i) => (
                            <div
                              key={answer.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border text-sm transition-colors",
                                answer.isCorrect
                                  ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-300/60 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300"
                                  : "bg-background border-border/50 text-muted-foreground",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold border",
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
                              <span className="flex-1 text-xs leading-relaxed">
                                {answer.content}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Hint + actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-4">
                          {question.hint ? (
                            <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                              <span className="font-semibold text-foreground mr-1">
                                Hint:
                              </span>
                              {question.hint}
                            </p>
                          ) : (
                            <span />
                          )}
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(question.id)}
                              className="h-8 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/25"
                            >
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs font-semibold text-red-600/70 hover:bg-red-50 dark:hover:bg-red-950/25 hover:text-red-600"
                            >
                              <X className="h-3.5 w-3.5 mr-1.5" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Approved questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">
                  Questions
                </h2>
                <span className="text-xs text-muted-foreground">
                  {approvedQuestions.length} verified
                </span>
              </div>

              {approvedQuestions.length === 0 ? (
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <FileQuestion className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No approved questions yet.
                    </p>
                    {canEdit && (
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Generate questions with AI or add them manually.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2.5">
                  {approvedQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="group flex gap-4 p-5 rounded-xl border border-border/50 bg-card hover:border-border hover:bg-muted/20 transition-all duration-150"
                    >
                      {/* Index badge */}
                      <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-muted border border-border/60 text-xs font-semibold text-muted-foreground mt-0.5 group-hover:border-primary/30 group-hover:text-primary transition-colors duration-150">
                        {index + 1}
                      </span>

                      <div className="flex-1 min-w-0 space-y-3">
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {question.content}
                        </p>

                        {/* Answer indicator pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {question.answers.map((answer, i) => (
                            <span
                              key={answer.id}
                              className={cn(
                                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-medium",
                                answer.isCorrect
                                  ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-300/60 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400"
                                  : "bg-muted/40 border-border/40 text-muted-foreground/60",
                              )}
                            >
                              {answer.isCorrect && (
                                <Check className="h-2.5 w-2.5" />
                              )}
                              {String.fromCharCode(65 + i)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: sidebar ── */}
          <aside className="space-y-6">
            {/* Materials */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">
                  Resources
                </h2>
                <span className="text-xs text-muted-foreground">
                  {materials.length} files
                </span>
              </div>

              {materials.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border/50 bg-muted/10">
                  <FileText className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No materials uploaded yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-card hover:border-border hover:bg-muted/20 transition-all duration-150"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted border border-border/60 flex items-center justify-center flex-shrink-0 group-hover:border-primary/30 transition-colors">
                        <FileText className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {material.fileName}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatFileSize(material.fileSize)}
                          {material.chunkCount > 0 &&
                            ` · ${material.chunkCount} chunks`}
                        </p>
                      </div>
                      <FeatureGate
                        variant="prompt"
                        title="Download resource"
                        description="Sign in to download course materials."
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg border border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex-shrink-0"
                        >
                          <Play className="h-3 w-3 translate-x-px fill-current" />
                        </Button>
                      </FeatureGate>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload + AI generate — only for editors */}
              {canEdit && (
                <div className="space-y-3 pt-1">
                  {uploadError && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-950/25 border border-red-300/60 dark:border-red-700/50 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                      {uploadError}
                    </div>
                  )}

                  {/* PDF upload zone */}
                  <label
                    className={cn(
                      "flex items-center justify-center gap-2.5 p-4 rounded-xl border border-dashed border-border/60 bg-muted/10 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-150",
                      isUploading && "opacity-60 pointer-events-none",
                    )}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs font-medium text-primary">
                          Processing PDF…
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-muted-foreground/50" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Upload PDF
                        </span>
                      </>
                    )}
                  </label>

                  {/* AI generate button */}
                  <Button
                    className="w-full rounded-xl h-11 gap-2.5 font-semibold text-sm"
                    onClick={() => setIsGenerateModalOpen(true)}
                  >
                    <BrainCircuit className="h-4 w-4" />
                    Generate with AI
                  </Button>
                  <p className="text-center text-[10px] text-muted-foreground/60">
                    Creates questions from your PDF material
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

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
          ) {
            setIsDraftModalOpen(false);
          }
        }}
        questions={draftQuestions}
        onSave={handleSaveDrafts}
        isSaving={isSavingDrafts}
      />
    </DashboardLayout>
  );
}
