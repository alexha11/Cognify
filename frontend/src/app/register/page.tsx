"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Loader2,
  ArrowLeft,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["STUDENT", "INSTRUCTOR"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState("");
  const { register: authRegister } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "STUDENT",
    },
  });

  const role = watch("role");

  const onSubmit = async (values: RegisterFormValues) => {
    setError("");
    try {
      await authRegister(values);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Registration failed",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <Card className="border border-border p-1">
            <CardHeader className="text-center pt-10 pb-8">
              <div className="mx-auto mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 animate-in zoom-in duration-500">
                <Sparkles className="h-5 w-5 text-[#F2B84B]" />
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                Create your account
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                Get started with Cognify for free
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="gap-6 flex flex-col"
              >
                {error && (
                  <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-xs font-medium text-destructive text-center animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {/* Role selector */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">
                      I am a
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setValue("role", "STUDENT")}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                          role === "STUDENT"
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        <GraduationCap className="h-4 w-4" />
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("role", "INSTRUCTOR")}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                          role === "INSTRUCTOR"
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        <BookOpen className="h-4 w-4" />
                        Instructor
                      </button>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-xs font-medium text-muted-foreground ml-1"
                      >
                        First name
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        {...register("firstName")}
                        className={`h-12 rounded-xl text-sm transition-all focus:ring-primary/5 ${
                          errors.firstName
                            ? "border-destructive/40 focus:ring-destructive/5"
                            : ""
                        }`}
                      />
                      {errors.firstName && (
                        <p className="text-xs font-medium text-destructive ml-1">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-xs font-medium text-muted-foreground ml-1"
                      >
                        Last name
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        {...register("lastName")}
                        className={`h-12 rounded-xl text-sm transition-all focus:ring-primary/5 ${
                          errors.lastName
                            ? "border-destructive/40 focus:ring-destructive/5"
                            : ""
                        }`}
                      />
                      {errors.lastName && (
                        <p className="text-xs font-medium text-destructive ml-1">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Email */}
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
                      placeholder="name@example.com"
                      {...register("email")}
                      className={`h-12 rounded-xl text-sm transition-all focus:ring-primary/5 ${
                        errors.email
                          ? "border-destructive/40 focus:ring-destructive/5"
                          : ""
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs font-medium text-destructive ml-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  {/* Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-xs font-medium text-muted-foreground ml-1"
                    >
                      Password
                    </Label>
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
                      <p className="text-xs font-medium text-destructive ml-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold rounded-full mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center pt-2 pb-8 text-sm">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary font-medium hover:text-primary/70 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
