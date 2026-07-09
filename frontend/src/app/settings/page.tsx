"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, SectionHeader } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPut } from "@/lib/api";
import { User as UserType } from "@/types";
import { useToast } from "@/components/ui/toast";
import {
  Settings,
  Building2,
  Shield,
  Save,
  Loader2,
  User,
  Mail,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [role, setRole] = useState(user?.role || "STUDENT");
  const [isSavingProfile, setIsSavingProfile] = useState(false);



  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/dashboard");
    } else if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setRole(user.role);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user) return;
      try {
        // No more organization data
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading]);



  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const updatedUser = await apiPut<UserType>("/auth/profile", {
        firstName,
        lastName,
        role,
      });
      // Update local storage and context here ideally, but next hard refresh or dashboard fetch will also get it
      // if `useAuth` had an `updateUser(user)` function, we'd use it. For now just show toast.

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...parsed, ...updatedUser }),
        );
      }

      showToast("Profile has been updated.", "success");
      // Force reload to update context properly
      window.location.reload();
    } catch (error) {
      console.error("Failed to update profile", error);
      showToast("Failed to save profile. Please try again.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-12">
        <PageHeader
          icon={Settings}
          title="Settings"
          description="Configure your organization and account preferences."
          badge="Configuration"
        />

        {/* Account Info (read-only) */}
        <section className="space-y-6">
          <SectionHeader title="Account" />
          <Card>
            <CardContent className="p-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <User className="h-3.5 w-3.5 opacity-40" />
                    First Name
                  </Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <User className="h-3.5 w-3.5 opacity-40" />
                    Last Name
                  </Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 opacity-40" />
                    Email Address
                  </Label>
                  <Input
                    value={user.email}
                    disabled
                    className="h-12 rounded-xl bg-secondary/20"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 opacity-40" />
                    Role
                  </Label>
                  {user.role === "ADMIN" ? (
                    <Badge className="text-[10px] font-bold uppercase tracking-widest mt-3">
                      {user.role}
                    </Badge>
                  ) : (
                    <select
                      value={role}
                      onChange={(e) =>
                        setRole(
                          e.target.value as "ADMIN" | "INSTRUCTOR" | "STUDENT",
                        )
                      }
                      className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="INSTRUCTOR">Instructor</option>
                    </select>
                  )}
                </div>

              </div>
              <div className="pt-6 mt-6 border-t border-border/40 flex justify-end">
                <Button
                  variant="default"
                  className="rounded-xl px-8"
                  onClick={handleSaveProfile}
                  disabled={
                    isSavingProfile ||
                    (firstName === user.firstName &&
                      lastName === user.lastName &&
                      role === user.role)
                  }
                >
                  {isSavingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>



        {/* Security Section */}
        <section className="space-y-6">
          <SectionHeader title="Security" />
          <Card className="border-dashed bg-transparent">
            <CardContent className="p-8">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-secondary text-muted-foreground/40">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-lg tracking-tight">
                    Password & Security
                  </p>
                  <p className="text-sm text-muted-foreground font-serif">
                    Password management and two-factor authentication settings
                    will be available in a future release.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Coming Soon
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Danger Zone */}
        <section className="space-y-6">
          <SectionHeader title="Danger Zone" variant="destructive" />
          <Card className="border-destructive/20">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="font-semibold text-lg tracking-tight">
                    Delete Account
                  </p>
                  <p className="text-sm text-muted-foreground font-serif">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  disabled
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
