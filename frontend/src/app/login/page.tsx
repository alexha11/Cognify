"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CardLightFlare } from "@/components/ui/ambient-lights";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState("");
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError("");
    try {
      await login(values);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Invalid credentials",
      );
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  // Google icon SVG
  function GoogleIcon({ className }: { className?: string }) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background spotlight */}
      <div
        className="pointer-events-none absolute -top-[150px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-40 dark:opacity-70 blur-[80px]"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 0%, rgba(255, 255, 255, 0.25) 0deg, rgba(139, 92, 246, 0.15) 60deg, transparent 120deg, transparent 240deg, rgba(59, 130, 246, 0.15) 300deg, rgba(255, 255, 255, 0.25) 360deg)",
        }}
      />
      <main className="flex min-h-screen items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <Card className="border border-border/80 p-1 relative overflow-hidden">
            <CardLightFlare />
            <CardHeader className="text-center pt-10 pb-12">
              <div className="mx-auto mb-5 flex justify-center animate-in zoom-in duration-500">
                <CognifyLogo size={100} />
              </div>
              <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                Welcome back
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-3">
                Sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10">
              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-sm font-medium rounded-xl border-border/80 hover:bg-muted/50 gap-3 mb-6"
                onClick={handleGoogleSignIn}
              >
                <GoogleIcon className="h-5 w-5" />
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground font-medium">
                    or sign in with email
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="gap-8 flex flex-col"
              >
                {error && (
                  <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 text-xs font-medium text-destructive text-center animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-xs font-medium text-muted-foreground ml-1"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. curator@cognify.io"
                      {...register("email")}
                      className={`h-12 rounded-xl text-sm transition-all focus:ring-2 focus:ring-primary/20 ${
                        errors.email
                          ? "border-destructive/40 focus:ring-destructive/20"
                          : ""
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs font-medium text-destructive ml-1 pt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <Label
                        htmlFor="password"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Password
                      </Label>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs font-medium text-primary/40 hover:text-primary transition-colors"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...register("password")}
                      className={`h-12 rounded-xl text-sm transition-all focus:ring-2 focus:ring-primary/20 ${
                        errors.password
                          ? "border-destructive/40 focus:ring-destructive/20"
                          : ""
                      }`}
                    />
                    {errors.password && (
                      <p className="text-xs font-medium text-destructive ml-1 pt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold rounded-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center pt-8 pb-10 text-sm">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-primary font-medium hover:text-primary/70 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
