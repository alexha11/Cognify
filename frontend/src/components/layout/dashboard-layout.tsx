"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
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
          <p className="text-sm text-muted-foreground font-serif italic">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* pl-[52px] = collapsed sidebar width. No z-index or opacity here to avoid stacking context bugs. */}
      <div className="flex min-h-screen flex-col pl-[52px]">
        <DashboardHeader />
        <main className="flex-1">
          <div className="p-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
