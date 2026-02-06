'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Course, Question, Material } from '@/types';
import { formatDate, formatFileSize } from '@/lib/utils';
import { 
  ArrowLeft, 
  FileQuestion, 
  FileText, 
  Upload, 
  Sparkles, 
  Check, 
  X, 
  Loader2,
  Play
} from 'lucide-react';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const canEdit = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';
  const isStudent = user?.role === 'STUDENT';

  const fetchCourse = async () => {
    try {
      const [courseRes, questionsRes, materialsRes] = await Promise.all([
        api.get(`/courses/${params.id}`),
        api.get(`/questions/course/${params.id}`),
        api.get(`/materials/course/${params.id}`),
      ]);
      setCourse(courseRes.data);
      setQuestions(questionsRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error('Failed to fetch course', error);
      router.push('/courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [params.id]);

  const handleApprove = async (questionId: string) => {
    try {
      await api.post(`/questions/${questionId}/approve`);
      fetchCourse();
    } catch (error) {
      console.error('Failed to approve question', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) return null;

  const pendingQuestions = questions.filter(q => !q.approved);
  const approvedQuestions = questions.filter(q => q.approved);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {course.name}
                <Badge variant={course.isPublished ? 'success' : 'secondary'}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </h1>
              <p className="mt-2 text-gray-500">
                {course.description || 'No description'}
              </p>
            </div>
            <div className="flex gap-3">
              {isStudent && approvedQuestions.length > 0 && (
                <Link href={`/quiz/${course.id}`}>
                  <Button>
                    <Play className="h-4 w-4" />
                    Start Quiz
                  </Button>
                </Link>
              )}
              {canEdit && (
                <Link href={`/ai-generate?courseId=${course.id}`}>
                  <Button>
                    <Sparkles className="h-4 w-4" />
                    Generate Questions
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileQuestion className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold">{approvedQuestions.length}</p>
                  <p className="text-sm text-gray-500">Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{materials.length}</p>
                  <p className="text-sm text-gray-500">Materials</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {canEdit && pendingQuestions.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{pendingQuestions.length}</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">Pending Approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pending Questions */}
        {canEdit && pendingQuestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                AI Questions - Pending Approval
              </CardTitle>
              <CardDescription>Review and approve AI-generated questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingQuestions.map((question) => (
                <div key={question.id} className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4 dark:border-yellow-800 dark:bg-yellow-900/10">
                  <p className="font-medium text-gray-900 dark:text-white">{question.content}</p>
                  <div className="mt-3 space-y-1">
                    {question.answers.map((answer, i) => (
                      <div key={answer.id} className={`text-sm ${answer.isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                        {String.fromCharCode(65 + i)}. {answer.content} {answer.isCorrect && '✓'}
                      </div>
                    ))}
                  </div>
                  {question.hint && (
                    <p className="mt-2 text-sm text-gray-500">
                      <strong>Hint:</strong> {question.hint}
                    </p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(question.id)}>
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Approved Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {approvedQuestions.length === 0 ? (
              <div className="py-8 text-center">
                <FileQuestion className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">No questions yet</p>
                {canEdit && (
                  <Link href={`/ai-generate?courseId=${course.id}`}>
                    <Button className="mt-4">
                      <Sparkles className="h-4 w-4" />
                      Generate with AI
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {approvedQuestions.slice(0, 5).map((question, index) => (
                  <div key={question.id} className="rounded-lg border p-4">
                    <p className="font-medium">
                      {index + 1}. {question.content}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {question.answers.map((answer, i) => (
                        <div key={answer.id} className={`text-sm rounded px-2 py-1 ${answer.isCorrect ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {String.fromCharCode(65 + i)}. {answer.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {approvedQuestions.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{approvedQuestions.length - 5} more questions
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Materials */}
        <Card>
          <CardHeader>
            <CardTitle>Materials</CardTitle>
          </CardHeader>
          <CardContent>
            {materials.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">No materials uploaded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{material.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(material.fileSize)} • {formatDate(material.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
