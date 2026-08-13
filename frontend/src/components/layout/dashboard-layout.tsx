"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant="dashboard" />
      <Sidebar />
      <main className="flex min-h-screen flex-col pl-[52px]">
        {/* Extra space above the first card so page titles clear the sticky
            header instead of sitting right under it. Padding steps down on
            small screens, where a flat 2.5rem inset wasted most of the width. */}
        <div className="flex-1 px-5 pt-10 pb-16 sm:px-8 sm:pt-12 lg:px-10 lg:pt-14 lg:pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
