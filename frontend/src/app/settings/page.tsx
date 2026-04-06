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
import { useAuth } from "@/lib/auth";
import { apiGet, apiPut } from "@/lib/api";
import { Organization } from "@/types";
import { useToast } from "@/components/ui/toast";
import {
  Settings,
  Building2,
  Globe,
  Shield,
  Save,
  Loader2,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user || user.role !== "ADMIN") return;
      try {
        const orgData = await apiGet<Organization>("/organizations/me");
        if (orgData) {
          setOrganization(orgData);
          setOrgName(orgData.name);
          setOrgSlug(orgData.slug);
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading]);

  const handleSaveOrg = async () => {
    setIsSaving(true);
    try {
      const updated = await apiPut<Organization>("/organizations/me", {
        name: orgName,
      });
      setOrganization(updated);
      showToast("Organization settings have been updated.", "success");
    } catch (error) {
      console.error("Failed to update settings", error);
      showToast("Failed to save settings. Please try again.", "error");
    } finally {
      setIsSaving(false);
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

  if (!user || user.role !== "ADMIN") return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <Settings className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  Settings
                </h1>
                <p className="text-muted-foreground font-serif text-lg leading-relaxed">
                  Configure your organization and account preferences.
                </p>
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="px-4 py-1.5 h-fit text-[10px] font-bold uppercase tracking-widest bg-primary/5"
          >
            Configuration
          </Badge>
        </div>

        {/* Account Info (read-only) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Account</h2>
            <div className="h-[1px] flex-1 mx-8 bg-border/40" />
          </div>
          <Card>
            <CardContent className="p-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <User className="h-3.5 w-3.5 opacity-40" />
                    Full Name
                  </Label>
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 opacity-40" />
                    Email Address
                  </Label>
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {user.email}
                  </p>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 opacity-40" />
                    Role
                  </Label>
                  <Badge className="text-[10px] font-bold uppercase tracking-widest">
                    {user.role}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 opacity-40" />
                    Organization
                  </Label>
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {user.organizationName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Organization Settings */}
        {organization && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">
                Organization
              </h2>
              <div className="h-[1px] flex-1 mx-8 bg-border/40" />
            </div>

            <Card>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold tracking-tight">
                      Organization Details
                    </CardTitle>
                    <CardDescription className="font-serif">
                      Update your organization name and configuration.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label
                      htmlFor="orgName"
                      className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]"
                    >
                      Organization Name
                    </Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="h-12 rounded-xl"
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="orgSlug"
                      className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]"
                    >
                      Organization Slug
                    </Label>
                    <Input
                      id="orgSlug"
                      value={orgSlug}
                      disabled
                      className="h-12 rounded-xl bg-secondary/20"
                    />
                    <p className="text-xs text-muted-foreground font-serif italic">
                      The slug is auto-generated and cannot be changed.
                    </p>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Current Plan
                    </Label>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                      >
                        {organization.plan}
                      </Badge>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-xs text-primary p-0 h-auto"
                        onClick={() => router.push("/billing")}
                      >
                        Manage plan →
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Platform Statistics
                    </Label>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-muted-foreground">
                        <span className="text-foreground font-semibold">
                          {organization.userCount}
                        </span>{" "}
                        members
                      </span>
                      <span className="text-muted-foreground/30">•</span>
                      <span className="text-sm text-muted-foreground">
                        <span className="text-foreground font-semibold">
                          {organization.courseCount}
                        </span>{" "}
                        courses
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/40 flex justify-end">
                  <Button
                    variant="default"
                    className="rounded-xl px-8"
                    onClick={handleSaveOrg}
                    disabled={isSaving || orgName === organization.name}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Security Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Security</h2>
            <div className="h-[1px] flex-1 mx-8 bg-border/40" />
          </div>
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-destructive">
              Danger Zone
            </h2>
            <div className="h-[1px] flex-1 mx-8 bg-destructive/20" />
          </div>
          <Card className="border-destructive/20">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="font-semibold text-lg tracking-tight">
                    Delete Organization
                  </p>
                  <p className="text-sm text-muted-foreground font-serif">
                    Permanently delete your organization and all associated
                    data. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  disabled
                >
                  Delete Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
