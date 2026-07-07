"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CognifyLogo } from "@/components/ui/cognify-logo";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Save the JWT token exactly like the email/password login does
      localStorage.setItem("token", token);

      // Decode the token to get user info (without verification – just for storage)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          organizationId: payload.organizationId || "",
        };
        localStorage.setItem("user", JSON.stringify(user));
      } catch {
        // Token decoding failed, still redirect — profile will be fetched fresh
      }

      router.replace("/dashboard");
    } else {
      // No token — something went wrong, send back to login
      router.replace("/login?error=google_auth_failed");
    }
  }, [searchParams, router]);

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
