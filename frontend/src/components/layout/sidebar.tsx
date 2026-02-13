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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary transition-transform group-hover:scale-105">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground lowercase">
              cognify
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 p-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isGated = !user && (item as any).gated;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-secondary text-primary shadow-sm shadow-black/[0.02]"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-4">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground/50",
                    )}
                  />
                  {item.label}
                </div>
                {isGated && (
                  <Lock className="h-3 w-3 text-muted-foreground/30" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          {user ? (
            <div className="flex items-center gap-4 rounded-[20px] bg-secondary/30 p-4 border border-border/40">
              <Avatar className="h-9 w-9 border border-border/60 shadow-sm">
                <AvatarFallback className="text-[10px] font-bold bg-background text-primary/60">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate tracking-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                  {user.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-muted-foreground hover:bg-background hover:text-destructive"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-card p-5 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center text-primary">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                      Guest
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Upgrade for more
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button asChild size="sm" className="w-full text-xs">
                    <Link href="/register">Join Cognify</Link>
                  </Button>
                  <Link
                    href="/login"
                    className="block text-center text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Log in
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
