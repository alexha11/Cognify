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
  title = "Sign up to continue",
  description = "Create a free account to save your progress and access all features.",
  action = "Unlock everything",
}: AuthPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="relative w-full max-w-sm z-50 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </Button>

        <Card className="overflow-hidden border-border/50 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pt-12 pb-6 px-8">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/10 to-primary/5 text-primary shadow-sm ring-1 ring-inset ring-primary/10">
              <Sparkles className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </CardTitle>
            <CardDescription className="text-sm mt-3 leading-relaxed text-muted-foreground px-2">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-10 px-8">
            <Button
              asChild
              size="lg"
              className="w-full h-11 text-sm font-semibold rounded-xl shadow-sm transition-all hover:scale-[1.02]"
            >
              <Link href="/register">
                <UserPlus className="mr-2 h-4 w-4" />
                Create free account
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-11 text-sm font-semibold rounded-xl bg-background hover:bg-muted/50 transition-all border-border/60"
            >
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Link>
            </Button>

            <div className="mt-4 text-center">
              <button
                onClick={onClose}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                No thanks, continue as guest
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
