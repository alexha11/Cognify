'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { Course } from '@/types';
import { Sparkles, Loader2, Check, BookOpen } from 'lucide-react';

export default function AIGeneratePage() {
  const searchParams = useSearchParams();
  const preSelectedCourseId = searchParams.get('courseId');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(preSelectedCourseId || '');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ message: string; questionsCreated: number } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data);
      } catch (error) {
        console.error('Failed to fetch courses', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/ai/generate-questions', {
        courseId: selectedCourse,
        topic,
        count,
      });
      setResult(res.data);
      setTopic('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Question Generator
          </h1>
          <p className="mt-2 text-gray-500">
            Generate high-quality exam questions using AI
          </p>
        </div>

        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Questions</CardTitle>
            <CardDescription>
              Select a course and enter a topic to generate multiple choice questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {result && (
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        {result.message}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        The questions are pending approval
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="course">Select Course</Label>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading courses...
                  </div>
                ) : courses.length === 0 ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <BookOpen className="h-4 w-4" />
                    No courses available. Create a course first.
                  </div>
                ) : (
                  <select
                    id="course"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  >
                    <option value="">Select a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Subject</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Neural Networks, React Hooks, Linear Algebra..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Be specific for better results
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="count">Number of Questions</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  required
                />
                <p className="text-xs text-gray-500">
                  Maximum 10 questions per request
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isGenerating || !selectedCourse || !topic}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate {count} Questions
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-0">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              How it works
            </h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">1.</span>
                Select a course and enter the topic you want questions about
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">2.</span>
                AI generates multiple choice questions with 4 options each
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">3.</span>
                Review and approve questions before students can see them
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
