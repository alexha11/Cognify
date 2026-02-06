'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Brain, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-lg dark:border-gray-800/50 dark:bg-gray-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Cognify
          </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
              Master Any Subject with{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Cognify
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Create courses, upload materials, generate AI questions, and track student progress. 
              The complete platform for modern education.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div id="features" className="mt-32 grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-gray-200 bg-white/80 p-8 backdrop-blur transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/80">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Course Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create and organize courses, upload materials, and manage content with ease.
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-200 bg-white/80 p-8 backdrop-blur transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/80">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                AI Question Generation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate high-quality exam questions instantly using advanced AI technology.
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-200 bg-white/80 p-8 backdrop-blur transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/80">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Progress Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor student performance with detailed analytics and insights.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          © 2026 Cognify. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
