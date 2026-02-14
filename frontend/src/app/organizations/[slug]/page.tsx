"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Building2,
  BookOpen,
  ArrowLeft,
  Users,
  Calendar,
  HelpCircle,
  Play,
  Lock,
  Globe,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  questionCount: number;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  isPublic: boolean;
  plan: string;
  createdAt: string;
  userCount: number;
  courseCount: number;
  courses: Course[];
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const data = await apiGet<Organization>(`/organizations/slug/${slug}`);
        setOrganization(data);
      } catch (err: any) {
        console.error("Failed to fetch organization", err);
        setError("Organization not found");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchOrganization();
    }
  }, [slug]);

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-12 bg-card border border-border rounded-[40px] shadow-sm">
          <div className="mx-auto h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary/40 mb-8">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            Institutional access denied.
          </h1>
          <p className="text-muted-foreground font-serif leading-relaxed mb-10">
            We could not locate this organization within our database, or it is
            currently restricted to private access only.
          </p>
          <Link href="/organizations">
            <Button variant="pill" size="lg" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Institutional Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Navigation / Breadcrumb */}
        <div className="flex items-center justify-between mb-12">
          <nav className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Cognify
                </Link>
              </li>
              <li className="opacity-40">/</li>
              <li>
                <Link
                  href="/organizations"
                  className="hover:text-primary transition-colors"
                >
                  Organizations
                </Link>
              </li>
              <li className="opacity-40">/</li>
              <li className="text-primary/60">{organization.name}</li>
            </ol>
          </nav>
          <Link href="/organizations">
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] font-bold uppercase tracking-widest gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Organizations
            </Button>
          </Link>
        </div>

        {/* Organization Profile Header */}
        <Card className="mb-16 border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/40">
              {/* Identity Section */}
              <div className="p-10 md:p-12 md:max-w-md w-full flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-24 h-24 rounded-[32px] bg-secondary/40 border border-border/50 flex items-center justify-center overflow-hidden mb-8 shadow-sm">
                  {organization.logoUrl ? (
                    <img
                      src={organization.logoUrl}
                      alt={organization.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-primary/60" />
                  )}
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                    {organization.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold border-green-500/20 text-green-700 bg-green-500/5 normal-case tracking-widest flex self-start mx-auto md:mx-0"
                  >
                    <Globe className="w-3.5 h-3.5 mr-2" />
                    Verified Institution
                  </Badge>
                </div>
              </div>

              {/* Description & Metadata Section */}
              <div className="flex-1 p-10 md:p-12 bg-secondary/5 flex flex-col justify-between gap-12">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Organization Overview
                  </p>
                  <p className="text-xl text-muted-foreground font-serif leading-[1.6] italic">
                    {organization.description ||
                      "Synthesizing educational excellence with advanced course pathways."}
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Enrollment
                    </p>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-semibold text-foreground tracking-tighter">
                        {organization.userCount}
                      </p>
                      <span className="text-xs text-muted-foreground/60 pb-1 font-serif">
                        Members
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Courses
                    </p>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-semibold text-foreground tracking-tighter">
                        {organization.courseCount}
                      </p>
                      <span className="text-xs text-muted-foreground/60 pb-1 font-serif">
                        Pathways
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 hidden lg:block">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Archival Info
                    </p>
                    <div className="flex items-end gap-2">
                      <p className="text-base font-medium text-foreground tracking-tight">
                        {new Date(organization.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", year: "numeric" },
                        )}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 pb-1 uppercase tracking-tighter">
                        Established
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Institutional Pathways.
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden md:block">
              {organization.courses.length} educational units discoverable
            </p>
          </div>

          {organization.courses.length === 0 ? (
            <div className="p-20 text-center bg-card rounded-[40px] border border-dashed border-border/60">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30 mb-6" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Course processing...
              </h3>
              <p className="text-muted-foreground font-serif leading-relaxed italic">
                This organization is currently formulating its educational
                pathways.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
              {organization.courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group p-8 rounded-[32px] bg-card border border-border shadow-sm hover:border-primary/20 transition-all duration-500 flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-12 h-12 rounded-xl bg-secondary/40 border border-border/50 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                      <BookOpen className="w-5 h-5 text-primary/60 group-hover:text-primary-foreground transition-colors" />
                    </div>
                    {course.isPublic ? (
                      <Badge
                        variant="outline"
                        className="text-[8px] bg-green-500/5 border-green-500/10 text-green-700 tracking-[0.2em]"
                      >
                        Open
                      </Badge>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/30" />
                    )}
                  </div>

                  <div className="flex-1 space-y-3 mb-8">
                    <h3 className="text-xl font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {course.name}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-muted-foreground font-serif leading-relaxed italic line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-border/40">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <HelpCircle className="w-3.5 h-3.5 text-primary/40" />
                      {course.questionCount} Units
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-500">
                      Begin
                      <Play className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
