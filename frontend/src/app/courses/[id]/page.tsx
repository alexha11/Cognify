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
import { Course, Question, Material } from "@/types";
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
} from "lucide-react";
import { FeatureGate, AuthPromptModal } from "@/components/ui";

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
      // Reset the input so the same file can be re-selected
      e.target.value = "";
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
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Navigation / Return */}
        <div className="flex items-center justify-between">
          <nav className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Cognify
                </Link>
              </li>
              <li className="opacity-40">/</li>
              <li>
                <Link
                  href="/courses"
                  className="hover:text-primary transition-colors"
                >
                  Courses
                </Link>
              </li>
              <li className="opacity-40">/</li>
              <li className="text-primary/60">{course.name}</li>
            </ol>
          </nav>
          <Link href="/courses">
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] font-bold uppercase tracking-widest gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Courses
            </Button>
          </Link>
        </div>

        {/* Course Core Header */}
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border/40">
              {/* Info Section */}
              <div className="p-10 md:p-12 lg:max-w-xl w-full space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                      {course.name}
                    </h1>
                    <Badge
                      variant={course.isPublic ? "outline" : "secondary"}
                      className="gap-1.5"
                    >
                      {course.isPublic ? (
                        <Globe className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      {course.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <p className="text-xl text-muted-foreground font-serif leading-[1.6] italic">
                    {course.description ||
                      "Synthesizing deep-domain knowledge through structured course integration."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  {(!user || isStudent) && approvedQuestions.length > 0 && (
                    <Link href={`/quiz/${course.id}`}>
                      <Button
                        variant="pill"
                        size="lg"
                        className="shadow-xl shadow-black/5 px-10"
                      >
                        <Play className="h-4 w-4 mr-3 fill-current" />
                        Start Quiz
                      </Button>
                    </Link>
                  )}
                  {approvedQuestions.length > 0 && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full border-border hover:bg-secondary/50"
                      onClick={handleShareLink}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-3 text-green-500" />
                          Link Copied!
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4 mr-3 text-primary/60" />
                          Share Quiz
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Snapshot Section */}
              <div className="flex-1 p-10 md:p-12 bg-secondary/5 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-8">
                    Course Metrics
                  </p>
                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Assessments
                      </p>
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-semibold text-foreground tracking-tighter">
                          {approvedQuestions.length}
                        </p>
                        <span className="text-xs text-muted-foreground/60 pb-1 font-serif">
                          Questions
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Materials
                      </p>
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-semibold text-foreground tracking-tighter">
                          {materials.length}
                        </p>
                        <span className="text-xs text-muted-foreground/60 pb-1 font-serif">
                          Documents
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {canEdit && pendingQuestions.length > 0 && (
                  <div className="mt-12 p-6 rounded-3xl bg-yellow-500/5 border border-yellow-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground tracking-tight">
                          {pendingQuestions.length} pending review
                        </p>
                        <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">
                          Awaiting verification
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-yellow-600/40" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-12">
            {/* Pending Questions */}
            {canEdit && pendingQuestions.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Pending Review
                  </h3>
                  <Badge
                    variant="warning"
                    className="text-[8px] bg-yellow-500/5 border-yellow-500/20 text-yellow-700 tracking-widest font-bold"
                  >
                    Verification Required
                  </Badge>
                </div>
                <div className="space-y-6">
                  {pendingQuestions.map((question) => (
                    <Card
                      key={question.id}
                      className="border-yellow-500/10 bg-yellow-500/[0.02]"
                    >
                      <CardContent className="p-8 space-y-8">
                        <p className="text-lg font-medium text-foreground leading-relaxed">
                          {question.content}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {question.answers.map((answer, i) => (
                            <div
                              key={answer.id}
                              className={`p-4 rounded-2xl border text-sm transition-all duration-300 flex items-center justify-between ${
                                answer.isCorrect
                                  ? "bg-green-500/5 border-green-500/20 text-green-700 font-medium"
                                  : "bg-background/50 border-border/40 text-muted-foreground"
                              }`}
                            >
                              <span className="flex-1">
                                <span className="text-[10px] font-bold opacity-40 mr-3 italic">
                                  {String.fromCharCode(65 + i)} /
                                </span>
                                {answer.content}
                              </span>
                              {answer.isCorrect && (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="pt-6 border-t border-border/40 flex items-center justify-between">
                          {question.hint && (
                            <p className="text-xs text-muted-foreground font-serif italic">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40 not-italic mr-3">
                                Hint /
                              </span>
                              {question.hint}
                            </p>
                          )}
                          <div className="flex gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(question.id)}
                              className="text-[10px] font-bold uppercase tracking-widest text-green-700 hover:bg-green-500/10 hover:text-green-800"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] font-bold uppercase tracking-widest text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                            >
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

            {/* Approved Questions List */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Questions
                </h3>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {approvedQuestions.length} verified
                </div>
              </div>

              {approvedQuestions.length === 0 ? (
                <EmptyState
                  icon={FileQuestion}
                  message="No approved questions yet."
                />
              ) : (
                <div className="space-y-4">
                  {(user
                    ? approvedQuestions
                    : approvedQuestions.slice(0, 10)
                  ).map((question, index) => (
                    <div
                      key={question.id}
                      className={cn(
                        "group p-6 rounded-3xl border border-border/50 bg-card/30 hover:bg-card hover:border-primary/10 transition-all duration-500",
                        !user && index >= 10
                          ? "opacity-30 grayscale blur-[1px]"
                          : "",
                      )}
                    >
                      <div className="flex gap-6 items-start">
                        <span className="text-2xl font-semibold text-primary/10 tracking-tighter tabular-nums pt-1 group-hover:text-primary/20 transition-colors">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="space-y-4 flex-1">
                          <p className="text-base font-medium text-foreground tracking-tight leading-relaxed">
                            {question.content}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {question.answers.map((answer, i) => (
                              <Badge
                                key={answer.id}
                                variant="outline"
                                className={cn(
                                  "text-[8px] font-bold tracking-widest transition-all duration-500",
                                  answer.isCorrect
                                    ? "bg-green-500/5 border-green-500/20 text-green-700/60"
                                    : "bg-secondary/20 border-border/30 text-muted-foreground/40",
                                )}
                              >
                                {String.fromCharCode(64 + (i + 1))}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!user && (
                    <Card className="border-dashed border border-border/60 bg-secondary/5 mt-12 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
                      <CardContent className="p-12 text-center space-y-8 relative z-10">
                        <div className="mx-auto w-16 h-16 bg-primary/5 rounded-[24px] flex items-center justify-center text-primary/40">
                          <Lock className="h-8 w-8" />
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-2xl font-semibold tracking-tight text-foreground">
                            Unlock Full Access
                          </h4>
                          <p className="text-muted-foreground font-serif italic max-w-sm mx-auto leading-relaxed">
                            A total of{" "}
                            <span className="text-primary font-bold not-italic">
                              {approvedQuestions.length} questions
                            </span>{" "}
                            are available. Login to view all questions.
                          </p>
                        </div>
                        <FeatureGate
                          variant="prompt"
                          title="Full Access"
                          description="Sign in to access all assessment questions and track your progress."
                        >
                          {" "}
                        </FeatureGate>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-12">
            {/* Supplemental Materials */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Resources
                </h3>
              </div>

              {materials.length === 0 ? (
                <div className="p-10 text-center bg-secondary/5 rounded-[32px] border border-dashed border-border/40">
                  <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] italic">
                    No supplemental media.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <Card
                      key={material.id}
                      className="border-border/40 bg-card/40 hover:bg-card transition-all duration-300"
                    >
                      <CardContent className="p-5 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center text-primary/40 group-hover:text-primary transition-all duration-500">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-foreground tracking-tight line-clamp-1">
                              {material.fileName}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {formatFileSize(material.fileSize)} •{" "}
                              {material.chunkCount > 0
                                ? `${material.chunkCount} chunks`
                                : "Doc"}
                            </p>
                          </div>
                        </div>
                        <FeatureGate
                          variant="prompt"
                          title="Download Resource"
                          description="Sign in to download course materials."
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full border border-border/40 group-hover:border-primary group-hover:text-primary transition-all duration-500"
                          >
                            <Play className="h-3 w-3 translate-x-[1px] fill-current" />
                          </Button>
                        </FeatureGate>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {canEdit && (
                <div className="mt-4">
                  {uploadError && (
                    <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-xs font-medium text-destructive mb-3">
                      {uploadError}
                    </div>
                  )}
                  <label
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-border/60 bg-secondary/5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300",
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
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                          Processing PDF...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground/40" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Upload PDF
                        </span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
