"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  BarChart3,
  Settings,
  Users,
  Sparkles,
  LogOut,
  CreditCard,
  Lock,
  UserCircle,
  Shield,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = {
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin", label: "Admin Panel", icon: Shield },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/questions", label: "Questions", icon: FileQuestion },
    { href: "/ai-generate", label: "AI Generate", icon: Sparkles },
    { href: "/users", label: "Users", icon: Users },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  INSTRUCTOR: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/questions", label: "Questions", icon: FileQuestion },
    { href: "/ai-generate", label: "AI Generate", icon: Sparkles },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ],
  STUDENT: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/quiz", label: "Take Quiz", icon: FileQuestion },
    { href: "/progress", label: "My Progress", icon: BarChart3 },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const items = user
    ? navItems[user.role] || navItems.STUDENT
    : [
        { href: "/", label: "Home", icon: LayoutDashboard },
        {
          href: "/organizations",
          label: "Browse Organizations",
          icon: Building2,
        },
        {
          href: "/progress",
          label: "My Progress",
          icon: BarChart3,
          gated: true,
        },
        {
          href: "/ai-generate",
          label: "AI Generate",
          icon: Sparkles,
          gated: true,
        },
      ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6 dark:border-gray-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Cognify
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isGated = !user && (item as any).gated;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn("h-5 w-5", isActive && "text-indigo-600")}
                  />
                  {item.label}
                </div>
                {isGated && <Lock className="h-3.5 w-3.5 text-gray-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          {user ? (
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                  {user.role.toLowerCase()}
                </p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-800"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 p-4 border border-indigo-100/50 dark:border-indigo-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                      Guest Mode
                    </p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                      Limited access
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    asChild
                    className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Link href="/register">Sign Up Free</Link>
                  </Button>
                  <Link
                    href="/login"
                    className="block text-center text-[11px] font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
