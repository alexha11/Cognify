"use client";

import Link from "next/link";
import { Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function Header() {
  const { user, isLoading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-lg dark:border-gray-800/50 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Cognify
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/organizations"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hidden sm:block"
          >
            Browse Organizations
          </Link>
          <div className="flex items-center gap-4">
            {!user && !isLoading ? (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
