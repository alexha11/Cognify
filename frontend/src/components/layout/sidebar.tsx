"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();
  const n = t.nav;

  const navItems = {
    ADMIN: [
      { href: "/dashboard", label: n.dashboard, icon: LayoutDashboard },
      { href: "/courses", label: n.courses, icon: BookOpen },
      { href: "/questions", label: n.questions, icon: FileQuestion },
      { href: "/analytics", label: n.analytics, icon: BarChart3 },
      { href: "/settings", label: n.settings, icon: Settings },
      { href: "/contact", label: n.contact, icon: HelpCircle },
    ],
    INSTRUCTOR: [
      { href: "/dashboard", label: n.dashboard, icon: LayoutDashboard },
      { href: "/courses", label: n.courses, icon: BookOpen },
      { href: "/questions", label: n.questions, icon: FileQuestion },
      { href: "/analytics", label: n.analytics, icon: BarChart3 },
      { href: "/contact", label: n.contact, icon: HelpCircle },
    ],
    STUDENT: [
      { href: "/dashboard", label: n.dashboard, icon: LayoutDashboard },
      { href: "/courses", label: n.courses, icon: BookOpen },
      { href: "/progress", label: n.progress, icon: BarChart3 },
      { href: "/contact", label: n.contact, icon: HelpCircle },
    ],
  };

  const guestItems = [
    { href: "/", label: n.home, icon: LayoutDashboard },
    { href: "/courses", label: n.courses, icon: BookOpen },
    { href: "/contact", label: n.contact, icon: HelpCircle },
  ];

  const items = user ? navItems[user.role] || navItems.STUDENT : guestItems;

  return (
    <aside className="group fixed left-0 top-14 flex h-[calc(100vh-3.5rem)] w-[52px] flex-col overflow-hidden border-r border-border/90 transition-all duration-300 hover:w-56 hover:shadow-2xl z-40 bg-[var(--background)]">
      <div className="flex h-full w-56 flex-col">
        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 p-2 pt-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/12 text-primary border-l-2 border-primary ml-[-1px]"
                    : "text-muted-foreground hover:bg-primary/6 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
