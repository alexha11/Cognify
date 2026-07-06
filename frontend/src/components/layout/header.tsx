"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Shield, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CognifyLogo } from "@/components/ui/cognify-logo";

const roleConfig: Record<
  string,
  { label: string; icon: typeof Shield; color: string }
> = {
  ADMIN: { label: "Admin", icon: Shield, color: "text-rose-500" },
  INSTRUCTOR: { label: "Instructor", icon: BookOpen, color: "text-indigo-500" },
  STUDENT: { label: "Student", icon: GraduationCap, color: "text-emerald-500" },
};

interface HeaderProps {
  variant?: "dashboard" | "public";
}

export function Header({ variant = "public" }: HeaderProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
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

  const isDashboard = variant === "dashboard";

  return (
    <header
      className={cn(
        "z-10 flex items-center justify-between border-b border-border backdrop-blur-md",
        isDashboard
          ? "sticky top-0 h-14 bg-background/90 px-8"
          : "fixed top-0 left-0 right-0 h-16 bg-background/80",
      )}
    >
      <div
        className={cn(
          "flex w-full items-center justify-between",
          isDashboard ? "" : "mx-auto max-w-7xl px-6",
        )}
      >
        {/* Left: Page breadcrumb / logo */}
        <div className="flex items-center gap-8">
          <Link
            href={isDashboard ? "/dashboard" : "/"}
            className="flex items-center"
          >
            <CognifyLogo size={100} />
          </Link>
        </div>

        {/* Right: User pill or Login/Signup */}
        <div className="flex items-center gap-3">
          {!isLoading && !user ? (
            <>
              <Link href="/login">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="rounded-full bg-zinc-950 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md"
                >
                  Sign up
                </Button>
              </Link>
            </>
          ) : user ? (
            <div className="relative flex items-center gap-3" ref={ref}>
              {!isDashboard && (
                <Link href="/dashboard">
                  <Button
                    size="sm"
                    className="rounded-full bg-zinc-950 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md"
                  >
                    Dashboard
                  </Button>
                </Link>
              )}
              <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-3 rounded-xl bg-card px-3 py-2 transition-all duration-200",
                  "hover:border-foreground/20 hover:shadow-sm",
                  open && "border-foreground/20 shadow-sm",
                )}
              >
                <Avatar className="h-7 w-7 shrink-0 border border-border/60">
                  <AvatarFallback className="bg-background text-[9px] font-bold text-primary/70">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* Dropdown */}
              {open && (
                <div className="fixed right-6 top-14 w-56 overflow-hidden rounded-2xl border border-border bg-[var(--background)] shadow-2xl ring-1 ring-black/5">
                  {/* User info */}
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-[13px] font-semibold text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {(() => {
                        const role =
                          roleConfig[user.role] ?? roleConfig.STUDENT;
                        const RoleIcon = role.icon;
                        return (
                          <>
                            <RoleIcon
                              className={cn("h-3.5 w-3.5", role.color)}
                            />
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                role.color,
                              )}
                            >
                              {role.label}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <User className="h-4 w-4 shrink-0" />
                      Edit Profile
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-border p-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/5"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign out
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
