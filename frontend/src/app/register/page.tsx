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

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(1, "Organization name is required"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState("");
  const { register: authRegister } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

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
            <CardHeader className="text-center pt-10 pb-12">
              <div className="mx-auto w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8 animate-in zoom-in duration-500">
                <Sparkles className="h-6 w-6" />
              </div>
              <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                Begin your{" "}
                <span className="text-primary/40 italic font-serif">
                  odyssey.
                </span>
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground font-serif italic mt-3">
                Establish your cognitive profile and join a verified educational
                sphere.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="gap-8 flex flex-col"
              >
                {error && (
                  <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 text-[10px] font-bold text-destructive uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <div className="gap-6 flex flex-col">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1"
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
                        <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em] ml-1 pt-1">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1"
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
                        <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em] ml-1 pt-1">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Institution */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="organizationName"
                      className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1"
                    >
                      Cognitive Institution
                    </Label>
                    <Input
                      id="organizationName"
                      placeholder="e.g. Aalto University"
                      {...register("organizationName")}
                      className={`h-11 rounded-xl text-sm transition-all focus:ring-primary/5 ${
                        errors.organizationName
                          ? "border-destructive/40 focus:ring-destructive/5"
                          : ""
                      }`}
                    />
                    {errors.organizationName && (
                      <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em] ml-1 pt-1">
                        {errors.organizationName.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1"
                    >
                      Electronic Mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="curator@cognify.io"
                      {...register("email")}
                      className={`h-11 rounded-xl text-sm transition-all focus:ring-primary/5 ${
                        errors.email
                          ? "border-destructive/40 focus:ring-destructive/5"
                          : ""
                      }`}
                    />
                    {errors.email && (
                      <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em] ml-1 pt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1"
                    >
                      Passphrase
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
                      <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em] ml-1 pt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-sm font-bold tracking-[0.1em] rounded-2xl shadow-xl shadow-black/5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Initialize Identity"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center pt-8 pb-10 text-[10px] font-bold uppercase tracking-[0.2em]">
              <p className="text-muted-foreground/60">
                Existing researcher?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/70 transition-colors"
                >
                  Authorize Session
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
