"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { apiPut } from "@/lib/api";
import { User as UserType } from "@/types";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/ui/theme-provider";
import { useLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Shield,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  Languages,
} from "lucide-react";

export default function SettingsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const s = t.settings;

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState("");

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
    else if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    setIsLoading(false);
  }, [user, authLoading]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      // `role` is deliberately not sent: it is not a self-editable field, and
      // the backend rejects unknown properties. Role changes go through the
      // instructor-request approval flow.
      await apiPut<{ user: UserType }>("/auth/profile", {
        firstName,
        lastName,
      });
      // Re-read identity from the server rather than caching it client-side.
      await refreshUser();
      showToast(s.profileUpdated, "success");
    } catch {
      showToast(s.profileFailed, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    setPwError("");
    if (newPassword.length < 8) {
      setPwError(s.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(s.passwordsNoMatch);
      return;
    }
    setIsSavingPassword(true);
    try {
      await apiPut("/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(s.passwordUpdated, "success");
    } catch {
      setPwError(s.passwordIncorrect);
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  const profileChanged =
    firstName !== user.firstName || lastName !== user.lastName;

  const themeOptions: { value: "light" | "dark" | "system"; label: string; icon: typeof Sun; desc: string }[] = [
    { value: "light", label: s.themeLight, icon: Sun, desc: s.themeAlwaysLight },
    { value: "dark", label: s.themeDark, icon: Moon, desc: s.themeAlwaysDark },
    { value: "system", label: s.themeSystem, icon: Monitor, desc: s.themeMatchOS },
  ];

  const langOptions: { value: Language; label: string; flag: string; desc: string }[] = [
    { value: "en", label: s.langEnglish, flag: "🇬🇧", desc: s.langDefault },
    { value: "vi", label: s.langVietnamese, flag: "🇻🇳", desc: s.langOfficial },
    { value: "fi", label: s.langFinnish, flag: "🇫🇮", desc: s.langNordic },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* ── Header ── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {s.title}
          </h1>
          <p className="text-sm text-muted-foreground">{s.subtitle}</p>
        </div>

        {/* ── Profile ── */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 bg-muted/10">
            <h2 className="text-sm font-semibold text-foreground">{s.profile}</h2>
          </div>
          <CardContent className="p-6 space-y-6">
            {/* Avatar + meta */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary">{initials}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {firstName} {lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <span
                  className={cn(
                    "inline-flex items-center mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    user.role === "ADMIN"
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : user.role === "INSTRUCTOR"
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-muted border-border/60 text-muted-foreground",
                  )}
                >
                  {user.role}
                </span>
              </div>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium text-muted-foreground">
                  {s.firstName}
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-9 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium text-muted-foreground">
                  {s.lastName}
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-9 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                {s.emailAddress}
              </Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="h-9 rounded-xl text-sm bg-muted/40"
              />
              <p className="text-[10px] text-muted-foreground/60">{s.emailCannotBeChanged}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-medium text-muted-foreground">
                {s.role}
              </Label>
              {/*
                Read-only. This used to be an editable <select> that PUT the
                chosen role straight to the server, letting any user grant
                themselves elevated access and bypass the instructor-request
                approval flow. The backend no longer accepts a role here.
              */}
              <div className="flex items-center gap-3 h-9 px-3 rounded-xl border border-border/50 bg-muted/40">
                <Shield className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-sm text-muted-foreground">
                  {user.role === "ADMIN"
                    ? s.administrator
                    : user.role === "INSTRUCTOR"
                      ? t.auth.instructor
                      : t.auth.student}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                {s.roleDescriptions[user.role]}
              </p>
            </div>

            <div className="pt-1 flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={isSavingProfile || !profileChanged}
                className="rounded-xl h-9 px-5 text-sm font-semibold gap-2"
              >
                {isSavingProfile ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {s.saveProfile}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Appearance ── */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 bg-muted/10">
            <h2 className="text-sm font-semibold text-foreground">{s.appearance}</h2>
          </div>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground">{s.themeTitle}</p>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2.5 rounded-xl border p-4 transition-all duration-200",
                    theme === value
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20"
                      : "border-border/50 text-muted-foreground hover:border-foreground/20 hover:bg-secondary/30",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      theme === value
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Language ── */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 bg-muted/10 flex items-center gap-2">
            <Languages className="h-3.5 w-3.5 text-muted-foreground/70" />
            <h2 className="text-sm font-semibold text-foreground">{s.language}</h2>
          </div>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground">{s.languageTitle}</p>
            <div className="grid grid-cols-3 gap-3">
              {langOptions.map(({ value, label, flag, desc }) => (
                <button
                  key={value}
                  onClick={() => setLanguage(value)}
                  className={cn(
                    "flex flex-col items-center gap-2.5 rounded-xl border p-4 transition-all duration-200",
                    language === value
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20"
                      : "border-border/50 text-muted-foreground hover:border-foreground/20 hover:bg-secondary/30",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition-colors",
                      language === value ? "bg-primary/10" : "bg-muted/50",
                    )}
                  >
                    {flag}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Security ── */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 bg-muted/10">
            <h2 className="text-sm font-semibold text-foreground">{s.security}</h2>
          </div>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground">
              Update your password. Use at least 8 characters with a mix of letters and numbers.
            </p>

            {pwError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/25 border border-red-300/60 dark:border-red-700/50 text-xs font-medium text-red-600 dark:text-red-400">
                {pwError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="currentPw" className="text-xs font-medium text-muted-foreground">
                  {s.currentPassword}
                </Label>
                <div className="relative">
                  <Input
                    id="currentPw"
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-9 rounded-xl text-sm pr-9"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newPw" className="text-xs font-medium text-muted-foreground">
                    {s.newPassword}
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPw"
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-9 rounded-xl text-sm pr-9"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPw" className="text-xs font-medium text-muted-foreground">
                    {s.confirmPassword}
                  </Label>
                  <Input
                    id="confirmPw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "h-9 rounded-xl text-sm",
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-400 focus:border-red-400"
                        : confirmPassword && confirmPassword === newPassword
                          ? "border-emerald-400 focus:border-emerald-400"
                          : "",
                    )}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((lvl) => {
                      const strength =
                        newPassword.length >= 12 ? 4
                          : newPassword.length >= 10 ? 3
                            : newPassword.length >= 8 ? 2
                              : 1;
                      return (
                        <div
                          key={lvl}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors duration-300",
                            lvl <= strength
                              ? strength === 4 ? "bg-emerald-500"
                                : strength === 3 ? "bg-primary"
                                  : strength === 2 ? "bg-amber-500"
                                    : "bg-red-500"
                              : "bg-muted",
                          )}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {newPassword.length >= 12 ? s.passwordStrong
                      : newPassword.length >= 10 ? s.passwordGood
                        : newPassword.length >= 8 ? s.passwordAcceptable
                          : s.passwordTooShortLabel}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                onClick={handleSavePassword}
                disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                variant="outline"
                className="rounded-xl h-9 px-5 text-sm font-semibold gap-2"
              >
                {isSavingPassword ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                {s.updatePassword}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Danger zone ── */}
        <Card className="border-red-200/60 dark:border-red-800/40 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200/60 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/10 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">{s.dangerZone}</h2>
          </div>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">{s.deleteAccount}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.deleteAccountDesc}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm" className="text-xs font-medium text-muted-foreground">
                {s.typeDeleteToConfirm}
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="h-9 rounded-xl text-sm font-mono"
                placeholder="DELETE"
              />
            </div>
            <Button
              variant="outline"
              disabled={deleteConfirm !== "DELETE"}
              className={cn(
                "rounded-xl h-9 px-5 text-sm font-semibold border-red-300/60 dark:border-red-700/50 text-red-600 dark:text-red-400",
                deleteConfirm === "DELETE"
                  ? "hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                  : "opacity-50 cursor-not-allowed",
              )}
            >
              {s.deleteAccount}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
