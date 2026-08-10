"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  User,
  Shield,
  GraduationCap,
  BookOpen,
  Home,
  ArrowUpRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CognifyLogo } from "@/components/ui/cognify-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLanguage } from "@/lib/i18n";

const roleConfig: Record<
  string,
  { label: string; icon: typeof Shield; color: string }
> = {
  ADMIN: { label: "Admin", icon: Shield, color: "text-error" },
  INSTRUCTOR: { label: "Instructor", icon: BookOpen, color: "text-primary" },
  STUDENT: { label: "Student", icon: GraduationCap, color: "text-success" },
};

interface HeaderProps {
  variant?: "dashboard" | "public";
}

export function Header({ variant = "public" }: HeaderProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const n = t.nav;
  const h = t.header;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-100 flex h-14 items-center justify-between border-b border-border/90 bg-background/90 px-8 backdrop-blur-md">
      <div className="flex w-full items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center">
            <CognifyLogo size={100} />
          </Link>
        </div>

        {/* Right: User pill or Login/Signup */}
        <div className="flex items-center gap-3">
          {!isLoading && !user ? (
            <>
              <ThemeToggle />
              <LanguageToggle />
              <Link href="/login">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                >
                  {h.loginButton}
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/85 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                >
                  {h.signupButton}
                </Button>
              </Link>
            </>
          ) : user ? (
            <div className="relative flex items-center gap-3" ref={ref}>
              <ThemeToggle />
              <LanguageToggle />
              <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-3 rounded-xl bg-card px-3 py-2 transition-all duration-200",
                  "hover:border-foreground/20 hover:shadow-sm",
                  open && "border-foreground/20 shadow-sm",
                )}
              >
                <Avatar className="h-7 w-7 shrink-0 border border-border/60">
                  <AvatarFallback className="bg-background text-xs font-bold text-primary/70">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* Dropdown */}
              {open && (
                <div className="fixed right-6 top-14 w-60 origin-top-right animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden rounded-xl border border-border/80 bg-[var(--background)] shadow-xl z-[200]">
                  {/* User info header */}
                  <div className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0 border border-border/60">
                        <AvatarFallback className="bg-primary/5 text-[11px] font-bold text-primary/70">
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-tight text-foreground">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      {(() => {
                        const role = roleConfig[user.role] ?? roleConfig.STUDENT;
                        const RoleIcon = role.icon;
                        return (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
                              role.color,
                              "bg-current/[0.06]",
                            )}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {role.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Navigation actions */}
                  <div className="border-t border-border/60 p-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-foreground/80 transition-colors hover:bg-primary/8 hover:text-foreground"
                    >
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {n.myProfile}
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-foreground/80 transition-colors hover:bg-primary/8 hover:text-foreground"
                    >
                      <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {n.contactSupport}
                    </Link>
                    <Link
                      href="/"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] text-foreground/80 transition-colors hover:bg-primary/8 hover:text-foreground"
                    >
                      <span className="flex items-center gap-3">
                        <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {n.homepage}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </Link>
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-border/60 p-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-foreground/80 transition-colors hover:bg-destructive/5 hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      {n.logout}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
