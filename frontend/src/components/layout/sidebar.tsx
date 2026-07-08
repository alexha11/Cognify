"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  BarChart3,
  Settings,
  Users,
  Lock,
  Shield,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const navItems = {
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/organizations", label: "Organizations", icon: Building2 },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/questions", label: "Questions", icon: FileQuestion },
    { href: "/users", label: "Users", icon: Users },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  INSTRUCTOR: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/organizations", label: "Organizations", icon: Building2 },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/questions", label: "Questions", icon: FileQuestion },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ],
  STUDENT: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/organizations", label: "Organizations", icon: Building2 },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/progress", label: "My Progress", icon: BarChart3 },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = user
    ? navItems[user.role] || navItems.STUDENT
    : [
        { href: "/", label: "Home", icon: LayoutDashboard },
        {
          href: "/organizations",
          label: "Browse Organizations",
          icon: Building2,
        },
        { href: "/courses", label: "Courses", icon: BookOpen },
        {
          href: "/progress",
          label: "My Progress",
          icon: BarChart3,
          gated: true,
        },
      ];

  return (
    <aside className="group fixed left-0 top-14 flex h-[calc(100vh-3.5rem)] w-[52px] flex-col overflow-hidden border-r border-border/90 transition-all duration-300 hover:w-56 hover:shadow-2xl z-40 bg-[var(--background)]">
      <div className="flex h-full w-56 flex-col">
        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 p-2 pt-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isGated = !user && (item as any).gated;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                />
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {item.label}
                </span>
                {isGated && (
                  <Lock className="ml-auto h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
