"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { Trophy, X, User } from "lucide-react";

interface GuestNameModalProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  onSkip: () => void;
  score: number;
  total: number;
}

export function GuestNameModal({
  isOpen,
  onSubmit,
  onSkip,
  score,
  total,
}: GuestNameModalProps) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name.trim() || "Anonymous");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onSkip}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative px-8 pt-8 pb-4">
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Save your score
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  You scored{" "}
                  <span className="font-bold text-foreground">
                    {score}/{total}
                  </span>{" "}
                  — enter your name to appear on the leaderboard.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                placeholder="Your nickname"
                className="h-12 pl-10 rounded-xl text-sm"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60">
                {name.length}/30
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl font-semibold"
              >
                Save to leaderboard
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                className="h-11 rounded-xl px-5"
              >
                Skip
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
