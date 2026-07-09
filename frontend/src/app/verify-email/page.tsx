"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { CognifyLogo } from "@/components/ui/cognify-logo";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyEmail, resendVerification } = useAuth();

  useEffect(() => {
    if (!email) {
      router.replace("/register");
    }
  }, [email, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Handle paste of multiple characters
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newOtp[index + i] = pasted[i];
      }
      setOtp(newOtp);
      // Focus the next empty input or the last one
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await verifyEmail(email, code);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Invalid verification code. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setError("");
    setResendLoading(true);
    try {
      await resendVerification(email);
      setResendCooldown(60); // Reset cooldown
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to resend code. Try again later.",
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>

          <Card className="border border-border p-1">
            <CardHeader className="text-center pt-10 pb-8">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-in zoom-in duration-500">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                Check your email
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2 px-4">
                We sent a verification code to{" "}
                <span className="font-semibold text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {error && (
                  <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-xs font-medium text-destructive text-center animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={6} // allow paste
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="h-12 w-12 sm:h-14 sm:w-14 text-center text-lg sm:text-xl font-semibold rounded-xl border-border/80 focus:border-primary focus:ring-primary/20 transition-all"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold rounded-full mt-4"
                  disabled={isSubmitting || otp.join("").length !== 6}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Verify Email"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center pt-2 pb-8 text-sm">
              <p className="text-muted-foreground text-center">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendLoading}
                  className="text-primary font-medium hover:text-primary/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin inline-block mr-1" />
                  ) : null}
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Click to resend"}
                </button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
