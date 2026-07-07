"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CognifyLogo } from "@/components/ui/cognify-logo";
import { Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent strict mode double-fetching
    if (hasProcessed.current) return;

    const token = searchParams.get("token");

    if (token) {
      hasProcessed.current = true;
      
      const processLogin = async () => {
        try {
          // Save the JWT token first so apiGet can use it in the Authorization header
          localStorage.setItem("token", token);
          
          // Fetch the full user profile from the backend to get firstName/lastName
          const user = await apiGet<any>("/auth/profile");
          
          localStorage.setItem("user", JSON.stringify(user));
          
          // Force a full reload to the dashboard so AuthProvider picks up the new localStorage state immediately
          window.location.href = "/dashboard";
        } catch (error) {
          console.error("Failed to fetch profile during OAuth callback", error);
          router.replace("/login?error=google_auth_failed");
        }
      };

      processLogin();
    } else {
      // No token — something went wrong, send back to login
      router.replace("/login?error=google_auth_failed");
    }
  }, [searchParams, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <CognifyLogo size={80} />
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Signing you in…</span>
      </div>
      <Suspense fallback={null}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
