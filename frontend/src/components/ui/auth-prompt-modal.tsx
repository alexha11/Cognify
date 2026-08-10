"use client";

import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "./button";
import { Modal } from "./modal";
import { CognifyLogo } from "@/components/ui/cognify-logo";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthPromptModal({
  isOpen,
  onClose,
  title = "Sign up to continue",
  description =
    "Create a free account to save your progress and access all features.",
}: AuthPromptModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center gap-5 text-center">
        <CognifyLogo size={72} />

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button asChild size="lg" fullWidth>
            <Link href="/register">
              <UserPlus />
              Create free account
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" fullWidth>
            <Link href="/login">
              <LogIn />
              Sign in
            </Link>
          </Button>
        </div>

        <Button variant="link" size="sm" onClick={onClose}>
          No thanks, continue as guest
        </Button>
      </div>
    </Modal>
  );
}
