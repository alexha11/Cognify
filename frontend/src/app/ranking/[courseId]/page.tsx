"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LeaderboardResponse, LeaderboardEntry } from "@/types";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Medal,
  Loader2,
  ArrowLeft,
  Crown,
  Play,
  Users,
} from "lucide-react";

export default function RankingPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user } = useAuth();

  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await apiGet<LeaderboardResponse>(
          `/leaderboard/${courseId}?t=${Date.now()}`,
        );
        setData(res);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [courseId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const entries = data?.entries || [];
  const courseName = data?.courseName || "Course";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Leaderboard
                  </h1>
                  <p className="text-sm text-muted-foreground">{courseName}</p>
                </div>
              </div>
            </div>
            <Link href={`/quiz/${courseId}`}>
              <Button size="sm" className="rounded-xl gap-2">
                <Play className="h-3.5 w-3.5" />
                Take quiz
              </Button>
            </Link>
          </div>
        </div>

        {/* Podium — top 3 */}
        {entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {[entries[1], entries[0], entries[2]].map((entry, visualIdx) => {
              const rank = visualIdx === 0 ? 2 : visualIdx === 1 ? 1 : 3;
              const isCurrentUser =
                user && entry.userId && entry.userId === user.id;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "relative flex flex-col items-center p-5 rounded-2xl border transition-all",
                    rank === 1
                      ? "bg-amber-50/50 dark:bg-amber-950/15 border-amber-300/50 dark:border-amber-700/40 -mt-4 pb-7"
                      : "bg-card border-border/50",
                    isCurrentUser && "ring-2 ring-primary/30",
                  )}
                >
                  {/* Medal */}
                  <div
                    className={cn(
                      "text-2xl mb-2",
                      rank === 1 && "text-3xl",
                    )}
                  >
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                  </div>

                  {/* Avatar circle */}
                  <div
                    className={cn(
                      "h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold mb-2 border",
                      rank === 1
                        ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300/60 dark:border-amber-700/50 text-amber-700 dark:text-amber-400"
                        : "bg-secondary border-border/60 text-muted-foreground",
                    )}
                  >
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>

                  <p
                    className={cn(
                      "text-sm font-semibold text-foreground text-center truncate w-full",
                      isCurrentUser && "text-primary",
                    )}
                  >
                    {entry.displayName}
                    {isCurrentUser && (
                      <span className="text-[10px] text-primary ml-1">
                        (you)
                      </span>
                    )}
                  </p>

                  <p className="text-2xl font-bold text-foreground mt-1">
                    {entry.percentage}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {entry.score}/{entry.totalQuestions} correct
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Full table */}
        {entries.length === 0 ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-16 text-center space-y-4">
              <Users className="h-12 w-12 text-muted-foreground/20 mx-auto" />
              <div>
                <p className="text-lg font-semibold text-foreground">
                  No scores yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to complete this quiz and claim the top spot!
                </p>
              </div>
              <Link href={`/quiz/${courseId}`}>
                <Button className="rounded-xl mt-2">
                  <Play className="h-4 w-4 mr-2" />
                  Start quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border/40 bg-muted/20">
              <div className="col-span-1 text-xs font-semibold text-muted-foreground">
                #
              </div>
              <div className="col-span-5 text-xs font-semibold text-muted-foreground">
                Player
              </div>
              <div className="col-span-2 text-xs font-semibold text-muted-foreground text-center">
                Score
              </div>
              <div className="col-span-2 text-xs font-semibold text-muted-foreground text-center">
                Accuracy
              </div>
              <div className="col-span-2 text-xs font-semibold text-muted-foreground text-right hidden sm:block">
                Date
              </div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-border/30">
              {entries.map((entry, i) => {
                const rank = i + 1;
                const isCurrentUser =
                  user && entry.userId && entry.userId === user.id;

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "grid grid-cols-12 gap-3 items-center px-5 py-3.5 transition-colors duration-150",
                      isCurrentUser
                        ? "bg-primary/5 hover:bg-primary/8"
                        : "hover:bg-muted/20",
                    )}
                  >
                    {/* Rank */}
                    <div className="col-span-1">
                      {rank <= 3 ? (
                        <span className="text-lg">
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border",
                          isCurrentUser
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "bg-secondary border-border/60 text-muted-foreground",
                        )}
                      >
                        {entry.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          isCurrentUser
                            ? "text-primary font-semibold"
                            : "text-foreground",
                        )}
                      >
                        {entry.displayName}
                        {isCurrentUser && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-[9px] font-bold uppercase tracking-widest bg-primary/10 border-primary/20 text-primary"
                          >
                            You
                          </Badge>
                        )}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-semibold text-foreground">
                        {entry.score}/{entry.totalQuestions}
                      </span>
                    </div>

                    {/* Accuracy */}
                    <div className="col-span-2 flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          entry.percentage >= 80
                            ? "text-emerald-600 dark:text-emerald-400"
                            : entry.percentage >= 50
                              ? "text-foreground"
                              : "text-red-500 dark:text-red-400",
                        )}
                      >
                        {entry.percentage}%
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 text-right hidden sm:block">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.completedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border/40 bg-muted/10">
              <p className="text-[10px] text-muted-foreground">
                Showing top {entries.length} players · Best score per player
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
