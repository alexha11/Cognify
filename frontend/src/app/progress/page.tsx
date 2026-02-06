'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { AttemptStats, Attempt, Course, CourseProgress } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { ProgressTeaser } from '@/components/ui';
import { BarChart3, TrendingUp, Check, X, BookOpen, Loader2 } from 'lucide-react';

export default function ProgressPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AttemptStats | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const [statsRes, attemptsRes, coursesRes] = await Promise.all([
          api.get('/attempts/stats'),
          api.get('/attempts/me'),
          api.get('/courses'),
        ]);
        
        setStats(statsRes.data);
        setAttempts(attemptsRes.data);
        setCourses(coursesRes.data);
        
        // Fetch progress for each course
        const progressMap: Record<string, CourseProgress> = {};
        for (const course of coursesRes.data as Course[]) {
          try {
            const progressRes = await api.get(`/attempts/course/${course.id}`);
            progressMap[course.id] = progressRes.data;
          } catch {
            // Course may not have progress yet
          }
        }
        setCourseProgress(progressMap);
      } catch (error) {
        console.error('Failed to fetch progress', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, authLoading]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Progress</h1>
          <p className="mt-1 text-gray-500">Track your learning journey</p>
        </div>

        {!user ? (
          <ProgressTeaser />
        ) : (
          <>
            {/* Overall Stats */}
            {stats && (
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <BarChart3 className="h-10 w-10 opacity-80" />
                      <div>
                        <p className="text-sm opacity-80 uppercase tracking-wider">Total Answered</p>
                        <p className="text-3xl font-bold">{stats.overall.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Check className="h-10 w-10 opacity-80" />
                      <div>
                        <p className="text-sm opacity-80 uppercase tracking-wider">Correct Answers</p>
                        <p className="text-3xl font-bold">{stats.overall.correct}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <TrendingUp className="h-10 w-10 opacity-80" />
                      <div>
                        <p className="text-sm opacity-80 uppercase tracking-wider">Accuracy Rate</p>
                        <p className="text-3xl font-bold">{stats.overall.percentage}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Course Progress */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="py-12 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-gray-500">No courses available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => {
                      const progress = courseProgress[course.id];
                      const percentage = progress?.percentage || 0;
                      
                      return (
                        <div key={course.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:border-indigo-100 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-lg">{course.name}</h3>
                            <Badge variant={percentage === 100 ? 'success' : 'secondary'} className="px-3 py-1">
                              {percentage}% Complete
                            </Badge>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          {progress && (
                            <div className="mt-3 flex justify-between text-sm text-gray-500">
                              <span className="font-medium">{progress.answered} / {progress.totalQuestions} questions answered</span>
                              <span className="text-green-600 font-bold">{progress.correct} correct</span>
                            </div>
                          )}
                          {progress && progress.remaining > 0 && (
                            <Link href={`/quiz/${course.id}`} className="mt-4 block text-right">
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                Continue Quiz
                              </Button>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Attempts */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {attempts.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-500">No recent activity found</p>
                    <Link href="/courses">
                      <Button className="mt-4 bg-indigo-600">Start Learning</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attempts.slice(0, 10).map((attempt) => (
                      <div key={attempt.id} className="flex items-center gap-4 rounded-xl border border-gray-50 dark:border-gray-900 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          attempt.isCorrect 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                        }`}>
                          {attempt.isCorrect ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{attempt.question.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] scale-90 origin-left">
                                {attempt.isCorrect ? 'Correct' : 'Incorrect'}
                            </Badge>
                            <p className="text-xs text-gray-500 font-medium">{formatDate(attempt.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
