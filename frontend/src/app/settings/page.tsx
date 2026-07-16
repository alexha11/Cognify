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
} from "lucide-react";

interface Preferences {
  emailNotifications: boolean;
  weeklyDigest: boolean;
  progressAlerts: boolean;
}

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "INSTRUCTOR" | "STUDENT">(
    "STUDENT",
  );

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
    if (!authLoading && !user) router.push("/dashboard");
    else if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setRole(user.role as "ADMIN" | "INSTRUCTOR" | "STUDENT");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    setIsLoading(false);
  }, [user, authLoading]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await apiPut<{ accessToken: string; user: UserType }>(
        "/auth/profile",
        { firstName, lastName, role },
      );
      if (response.accessToken)
        localStorage.setItem("token", response.accessToken);
      const stored = localStorage.getItem("user");
      if (stored)
        localStorage.setItem(
          "user",
          JSON.stringify({ ...JSON.parse(stored), ...response.user }),
        );
      showToast("Profile updated successfully.", "success");
      window.location.reload();
    } catch {
      showToast("Failed to save profile. Please try again.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    setPwError("");
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setIsSavingPassword(true);
    try {
      await apiPut("/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully.", "success");
    } catch {
      setPwError("Current password is incorrect or update failed.");
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
    firstName !== user.firstName ||
    lastName !== user.lastName ||
    role !== user.role;

  const roleDescriptions: Record<string, string> = {
    ADMIN: "Full platform access, manage all courses and users.",
    INSTRUCTOR: "Create and manage courses, generate questions.",
    STUDENT: "Access courses and track your learning progress.",
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* ── Header ── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account, preferences, and security.
          </p>
        </div>

        {/* ── Profile ── */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 bg-muted/10">
            <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          </div>
          <CardContent className="p-6 space-y-6">
            {/* Avatar + meta */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary">
                  {initials}
                </span>
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
                <Label
                  htmlFor="firstName"
                  className="text-xs font-medium text-muted-foreground"
                >
                  First name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-9 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="lastName"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Last name
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
              <Label
                htmlFor="email"
                className="text-xs font-medium text-muted-foreground"
              >
                Email address
              </Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="h-9 rounded-xl text-sm bg-muted/40"
              />
              <p className="text-[10px] text-muted-foreground/60">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="role"
                className="text-xs font-medium text-muted-foreground"
              >
                Role
              </Label>
              {user.role === "ADMIN" ? (
                <div className="flex items-center gap-3 h-9 px-3 rounded-xl border border-border/50 bg-muted/40">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-sm text-muted-foreground">
                    Administrator
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as typeof role)}
                    className="w-full h-9 appearance-none pl-3 pr-8 rounded-xl border border-border bg-background text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                  </select>
                  <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none rotate-90" />
                </div>
              )}
              <p className="text-[10px] text-muted-foreground/60">
                {roleDescriptions[role]}
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
                Save profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Security ── */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 bg-muted/10">
            <h2 className="text-sm font-semibold text-foreground">Security</h2>
          </div>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground">
              Update your password. Use at least 8 characters with a mix of
              letters and numbers.
            </p>

            {pwError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/25 border border-red-300/60 dark:border-red-700/50 text-xs font-medium text-red-600 dark:text-red-400">
                {pwError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="currentPw"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Current password
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
                    {showCurrentPw ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="newPw"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    New password
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
                      {showNewPw ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPw"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Confirm password
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
                        newPassword.length >= 12
                          ? 4
                          : newPassword.length >= 10
                            ? 3
                            : newPassword.length >= 8
                              ? 2
                              : 1;
                      return (
                        <div
                          key={lvl}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors duration-300",
                            lvl <= strength
                              ? strength === 4
                                ? "bg-emerald-500"
                                : strength === 3
                                  ? "bg-primary"
                                  : strength === 2
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              : "bg-muted",
                          )}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {newPassword.length >= 12
                      ? "Strong password"
                      : newPassword.length >= 10
                        ? "Good password"
                        : newPassword.length >= 8
                          ? "Acceptable password"
                          : "Password too short"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                onClick={handleSavePassword}
                disabled={
                  isSavingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                variant="outline"
                className="rounded-xl h-9 px-5 text-sm font-semibold gap-2"
              >
                {isSavingPassword ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                Update password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Danger zone ── */}
        <Card className="border-red-200/60 dark:border-red-800/40 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200/60 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/10 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">
              Danger zone
            </h2>
          </div>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Delete account
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Permanently deletes your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="deleteConfirm"
                className="text-xs font-medium text-muted-foreground"
              >
                Type{" "}
                <span className="font-mono font-semibold text-foreground">
                  DELETE
                </span>{" "}
                to confirm
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
              Delete my account
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
