"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "@/lib/auth";
import { AuthPromptModal } from "./auth-prompt-modal";
import { Lock } from "lucide-react";
import { Button } from "./button";

interface FeatureGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  description?: string;
  variant?: "blur" | "hide" | "prompt";
}

export function FeatureGate({
  children,
  fallback,
  title,
  description,
  variant = "prompt",
}: FeatureGateProps) {
  const { user, isLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (isLoading) return null;

  // If user is authenticated, show the feature
  if (user) {
    return <>{children}</>;
  }

  // Handle variants for guests
  if (variant === "hide") {
    return fallback ? <>{fallback}</> : null;
  }

  if (variant === "blur") {
    return (
      <div className="relative">
        <div className="filter blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-background/50 backdrop-blur-[2px]">
          <div className="text-center space-y-6 max-w-sm p-10 rounded-[32px] bg-card shadow-2xl border border-border">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/5 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight">
                {title || "Premium Access"}
              </h3>
              <p className="text-sm text-muted-foreground font-serif leading-relaxed">
                {description || "Please sign in to view this content."}
              </p>
            </div>
            <Button
              variant="pill"
              size="lg"
              onClick={() => setShowModal(true)}
              className="w-full"
            >
              Join Cognify to unlock
            </Button>
          </div>
        </div>
        <AuthPromptModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={title}
          description={description}
        />
      </div>
    );
  }

  // Default: show the modal trigger when children (likely a button) is clicked or just handle the modal
  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="contents cursor-pointer"
      >
        <div className="pointer-events-none opacity-80grayscale">
          {children}
        </div>
      </div>
      <AuthPromptModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={title}
        description={description}
      />
    </>
  );
}
