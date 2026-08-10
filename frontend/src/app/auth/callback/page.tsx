"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CognifyLogo } from "@/components/ui/cognify-logo";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

/**
 * Landing page for the Google OAuth redirect.
 *
 * There is no token to read here any more: the backend set an HttpOnly session
 * cookie before redirecting, so this page only has to wait for AuthProvider to
 * confirm the session and then move the user along. Keeping the token out of
 * the URL keeps it out of browser history, referrer headers and server logs.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace("/dashboard");
    } else {
      // Cookie missing or rejected — the sign-in did not complete.
      router.replace("/login?error=google_auth_failed");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <CognifyLogo size={80} />
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Signing you in…</span>
      </div>
    </div>
  );
}
