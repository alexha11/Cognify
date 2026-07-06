"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <Card className="border border-border p-1">
            <CardHeader className="text-center pt-10 pb-12">
              <div className="mx-auto mb-5 flex justify-center animate-in zoom-in duration-500">
                <CognifyLogo size={44} />
              </div>
              <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                Welcome back
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-3">
                Sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10">
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
                      className={`h-12 rounded-xl text-sm transition-all focus:ring-primary/5 ${
                        errors.email
                          ? "border-destructive/40 focus:ring-destructive/5"
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
                      className={`h-12 rounded-xl text-sm transition-all focus:ring-primary/5 ${
                        errors.password
                          ? "border-destructive/40 focus:ring-destructive/5"
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
