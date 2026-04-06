"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { getInitials, formatDate } from "@/lib/utils";
import {
  Users,
  Shield,
  Search,
  UserCircle,
  BookOpen,
  Sparkles,
  Loader2,
  Mail,
  Calendar,
} from "lucide-react";

interface OrgUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
  createdAt: string;
}

const roleConfig: Record<
  string,
  { label: string; color: string; icon: typeof Shield }
> = {
  ADMIN: {
    label: "Admin",
    color: "bg-primary text-primary-foreground",
    icon: Shield,
  },
  INSTRUCTOR: {
    label: "Instructor",
    color: "bg-secondary text-foreground",
    icon: BookOpen,
  },
  STUDENT: {
    label: "Student",
    color: "bg-secondary text-foreground",
    icon: Sparkles,
  },
};

export default function UsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (authLoading || !user || user.role !== "ADMIN") return;
      try {
        const data = await apiGet<OrgUser[]>("/organizations/users");
        setUsers(data || []);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [user, authLoading]);

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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchQuery === "" ||
      `${u.firstName} ${u.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    ALL: users.length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    INSTRUCTOR: users.filter((u) => u.role === "INSTRUCTOR").length,
    STUDENT: users.filter((u) => u.role === "STUDENT").length,
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  User Management
                </h1>
                <p className="text-muted-foreground font-serif text-lg leading-relaxed">
                  Manage organization members and role assignments.
                </p>
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="px-4 py-1.5 h-fit text-[10px] font-bold uppercase tracking-widest bg-primary/5"
          >
            {users.length} Members
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          {(
            [
              { key: "ALL", label: "Total Members", icon: Users },
              { key: "ADMIN", label: "Administrators", icon: Shield },
              { key: "INSTRUCTOR", label: "Instructors", icon: BookOpen },
              { key: "STUDENT", label: "Students", icon: Sparkles },
            ] as const
          ).map((stat) => (
            <Card
              key={stat.key}
              className={`cursor-pointer transition-all duration-300 ${
                roleFilter === stat.key
                  ? "border-primary/30 bg-secondary/30"
                  : "hover:bg-secondary/20"
              }`}
              onClick={() => setRoleFilter(stat.key)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  {roleFilter === stat.key && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold tracking-widest uppercase"
                    >
                      Active
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-semibold tracking-tighter text-foreground">
                    {roleCounts[stat.key]}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl bg-card border-border/60 text-base"
          />
        </div>

        {/* Users List */}
        <section className="space-y-4">
          {filteredUsers.length === 0 ? (
            <Card className="border-dashed py-16 bg-card/50">
              <CardContent className="text-center space-y-4 pt-0">
                <UserCircle className="mx-auto h-12 w-12 text-muted-foreground/20" />
                <p className="text-muted-foreground font-serif text-lg italic">
                  No users match your criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((member) => {
                const config = roleConfig[member.role];
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-6 p-5 rounded-2xl border border-border/40 bg-card hover:bg-secondary/10 transition-all duration-300 group"
                  >
                    <Avatar className="h-12 w-12 border border-border/60 shadow-sm">
                      <AvatarFallback className="text-xs font-bold bg-background text-primary/60">
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-lg tracking-tight truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 opacity-40" />
                          {member.email}
                        </span>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 opacity-40" />
                          {formatDate(member.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${config.color}`}
                    >
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
