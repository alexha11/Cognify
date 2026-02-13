"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Building2, BookOpen, Search, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  courseCount: number;
  createdAt: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await apiGet<Organization[]>("/organizations/public");
        setOrganizations(data || []);
      } catch (error) {
        console.error("Failed to fetch organizations", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Search & Header Section */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <nav className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">
              <ol className="flex items-center gap-2">
                <li>
                  <Link
                    href="/"
                    className="hover:text-primary transition-colors"
                  >
                    Cognify
                  </Link>
                </li>
                <li className="opacity-40">/</li>
                <li className="text-primary/60">Organizations</li>
              </ol>
            </nav>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
              Organizations
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Explore verified learning organizations and their courses. Find
              the perfect community for your learning journey.
            </p>
          </div>

          <div className="w-full md:w-96">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 h-12 rounded-2xl text-sm placeholder:text-muted-foreground/50 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        {/* Organizations Grid */}
        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-[40px] border border-dashed border-border/60">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No organizations found.
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "No organizations match your search."
                : "No organizations have been added yet."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOrgs.map((org) => (
              <Link
                key={org.id}
                href={`/organizations/${org.slug}`}
                className="group p-8 rounded-[32px] bg-card border border-border shadow-sm hover:border-primary/20 transition-all duration-500 flex flex-col h-full"
              >
                {/* Logo Area */}
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/40 border border-border/50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-7 h-7 text-primary/60" />
                    )}
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                    <ArrowRight className="w-4 h-4 translate-x-[-1px] group-hover:translate-x-0 transition-transform" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {org.name}
                  </h3>
                  {org.description && (
                    <p className="text-muted-foreground font-serif text-sm leading-relaxed line-clamp-3">
                      {org.description}
                    </p>
                  )}
                </div>

                {/* Footer Stats */}
                <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <BookOpen className="w-3.5 h-3.5" />
                    {org.courseCount} courses
                  </div>
                  <div className="text-[10px] font-medium text-primary/40">
                    Active
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
