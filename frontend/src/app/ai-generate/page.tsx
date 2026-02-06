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
import { useAuth } from '@/lib/auth';
import { Sparkles, Loader2, Check, BookOpen, Lock, ArrowRight } from 'lucide-react';
import { FeatureGate } from '@/components/ui';

export default function AIGeneratePage() {
  const searchParams = useSearchParams();
  const preSelectedCourseId = searchParams.get('courseId');
  
  const { user, isLoading: authLoading } = useAuth();
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
      if (authLoading || !user) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/courses?role=INSTRUCTOR');
        setCourses(res.data);
      } catch (error) {
        console.error('Failed to fetch courses', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [user, authLoading]);

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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 dark:shadow-none">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Question Generator
          </h1>
          <p className="mt-2 text-gray-500">
            Create high-quality exam questions in seconds
          </p>
        </div>

        {!user ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="overflow-hidden border-2 border-indigo-100 dark:border-indigo-900 shadow-xl">
                <div className="p-8 md:p-12 text-center space-y-8">
                    <div className="max-w-md mx-auto space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                            <Lock className="h-3 w-3" />
                            Premium Feature
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                            Harness the Power of AI
                        </h2>
                        <p className="text-gray-500 text-lg">
                            Instantly generate questions from any topic. 
                            Save hours of manual work and create comprehensive assessments for your students.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        {[
                            { title: 'Lightning Fast', desc: '10 questions in under 30 seconds.' },
                            { title: 'Any Topic', desc: 'From Quantum Physics to Pop Culture.' },
                            { title: 'Always Correct', desc: 'Peer-reviewed style accuracy.' }
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">{item.title}</h4>
                                <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4">
                        <FeatureGate variant="prompt" title="Unlock AI Generation" description="Instructors and Admins can use AI to generate questions directly into their courses.">
                            <Button size="lg" className="px-10 h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-105 active:scale-95">
                                Create Instructor Account
                                <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </FeatureGate>
                    </div>
                </div>
            </Card>
          </div>
        ) : (
          <>
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
                        className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-gray-900 dark:border-gray-800"
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12" 
                    disabled={isGenerating || !selectedCourse || !topic}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate {count} Questions
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-0 shadow-sm">
              <CardContent className="pt-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  How it works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { step: '1', title: 'Pick a Course', desc: 'Select where to add questions.' },
                    { step: '2', title: 'Define Topic', desc: 'AI tailoring to your subject.' },
                    { step: '3', title: 'Approve', desc: 'You have total control.' }
                  ].map((s, i) => (
                    <div key={i} className="relative">
                        <div className="text-4xl font-black text-indigo-600/10 absolute -top-2 -left-2">{s.step}</div>
                        <h4 className="font-bold text-sm relative z-10">{s.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
