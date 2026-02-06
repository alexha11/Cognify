'use client';

import { Sparkles, X, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  action?: string;
}

export function AuthPromptModal({ 
  isOpen, 
  onClose, 
  title = "Unlock Full Potential",
  description = "Join Cognify today to save your progress, track your stats, and access premium learning materials.",
  action = "Unlock everything"
}: AuthPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-2 bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <Card className="overflow-hidden shadow-2xl border-indigo-100 dark:border-indigo-900">
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardHeader className="text-center pt-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/40">
              <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="text-base mt-2">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-8">
            <Button asChild size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold">
              <Link href="/register">
                <UserPlus className="mr-2 h-5 w-5" />
                Sign Up for Free
              </Link>
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <Button asChild variant="outline" size="lg" className="w-full h-12 text-base font-semibold border-2">
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Link>
            </Button>

            <button 
              onClick={onClose}
              className="mt-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors py-2"
            >
              Continue as guest
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
