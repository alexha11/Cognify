'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Organization, Course, AttemptStats, PlanLimits } from '@/types';
import { 
  BookOpen, 
  FileQuestion, 
  Users, 
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<AttemptStats | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, coursesRes, limitsRes] = await Promise.all([
          api.get('/organizations/me'),
          api.get('/courses'),
          api.get('/organizations/limits'),
        ]);
        setOrganization(orgRes.data);
        setCourses(coursesRes.data);
        setLimits(limitsRes.data);

        if (user?.role === 'STUDENT') {
          const statsRes = await api.get('/attempts/stats');
          setStats(statsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const isInstructor = user.role === 'INSTRUCTOR';
  const isStudent = user.role === 'STUDENT';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user.firstName}!
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {user.organizationName} • {user.role.toLowerCase()}
            </p>
          </div>
          {(isAdmin || isInstructor) && (
            <div className="flex gap-3">
              <Link href="/courses">
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                  New Course
                </Button>
              </Link>
              <Link href="/ai-generate">
                <Button>
                  <Sparkles className="h-4 w-4" />
                  Generate Questions
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {organization?.courseCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(isAdmin || isInstructor) && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                      <FileQuestion className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Questions</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {courses.reduce((acc, c) => acc + c._count.questions, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Team Members</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {organization?.userCount || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isStudent && stats && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Questions Answered</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.overall.total}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Accuracy</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.overall.percentage}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isAdmin && organization && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                    <Sparkles className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Plan</p>
                    <Badge variant={organization.plan === 'FREE' ? 'secondary' : 'default'}>
                      {organization.plan}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {isStudent ? 'Available Courses' : 'Your Courses'}
            </CardTitle>
            <Link href="/courses">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : courses.length === 0 ? (
              <div className="py-8 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">No courses yet</p>
                {(isAdmin || isInstructor) && (
                  <Link href="/courses" className="mt-4 inline-block">
                    <Button>Create your first course</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.slice(0, 6).map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <div className="group rounded-xl border border-gray-200 p-4 transition-all hover:border-indigo-200 hover:shadow-lg dark:border-gray-800 dark:hover:border-indigo-800">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">
                        {course.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {course.description || 'No description'}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                        <span>{course._count.questions} questions</span>
                        <span>{course._count.materials} materials</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
