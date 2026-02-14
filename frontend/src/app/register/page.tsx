"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const { register: authRegister } = useAuth();

  const registerSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["STUDENT", "INSTRUCTOR"]),
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "STUDENT",
    },
  });

  const selectedRole = watch("role");

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
          <Card className="border border-border p-1">
            <CardHeader className="text-center pt-10 pb-8">
              <div className="mx-auto w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6 animate-in zoom-in duration-500">
                <Sparkles className="h-6 w-6" />
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
                  {/* Role Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue("role", "STUDENT")}
                      className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedRole === "STUDENT"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-muted bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-sm font-semibold">Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("role", "INSTRUCTOR")}
                      className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedRole === "INSTRUCTOR"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-muted bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-sm font-semibold">Instructor</span>
                    </button>
                  </div>
                  {errors.role && (
                    <p className="text-xs font-medium text-destructive ml-1">
                      {errors.role.message}
                    </p>
                  )}

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
                        className={`h-11 rounded-xl text-sm transition-all focus:ring-primary/5 ${
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
                        className={`h-11 rounded-xl text-sm transition-all focus:ring-primary/5 ${
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
                      className={`h-11 rounded-xl text-sm transition-all focus:ring-primary/5 ${
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
                      className={`h-11 rounded-xl text-sm transition-all focus:ring-primary/5 ${
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
                  className="w-full h-11 text-sm font-semibold rounded-xl mt-2"
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
