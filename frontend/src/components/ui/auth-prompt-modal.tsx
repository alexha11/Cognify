"use client";

import { Sparkles, X, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./card";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  action?: string;
}

export function AuthPromptModal({
  isOpen,
  onClose,
  title = "Unlock Full Potential",
  description = "Join Cognify today to save your progress, track your stats, and access premium learning materials.",
  action = "Unlock everything",
}: AuthPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-2 bg-background rounded-full shadow-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <Card className="overflow-hidden border-border bg-card">
          <CardHeader className="text-center pt-10 pb-8 px-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-base mt-2 font-serif text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-10 px-8">
            <Button asChild size="xl" variant="pill" className="w-full">
              <Link href="/register">
                <UserPlus className="mr-2 h-5 w-5" />
                Join for free
              </Link>
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="bg-card px-3">Returning member?</span>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              size="xl"
              className="w-full rounded-full"
            >
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" />
                Sign in
              </Link>
            </Button>

            <button
              onClick={onClose}
              className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Continue as guest
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
