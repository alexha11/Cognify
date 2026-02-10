"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, Loader2 } from "lucide-react";
import { AuthPromptModal } from "@/components/ui/auth-prompt-modal";
import { cn } from "@/lib/utils";
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
import { Header } from "@/components/layout";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

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
          <Card className="border border-border p-1">
            <CardHeader className="text-center pt-10 pb-12">
              <div className="mx-auto w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8 animate-in zoom-in duration-500">
                <Sparkles className="h-6 w-6" />
              </div>
              <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                Welcome{" "}
                <span className="text-primary/40 italic font-serif">back.</span>
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground font-serif italic mt-3">
                Securely access your autonomous learning environment.
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1"
                    >
                      Email identification
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
                      <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em] ml-1 pt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <Label
                        htmlFor="password"
                        className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                      >
                        Secret passphrase
                      </Label>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-[10px] font-bold text-primary/40 hover:text-primary transition-colors uppercase tracking-widest"
                      >
                        Lost key?
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
                    "Initialize Session"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center pt-8 pb-10 text-[10px] font-bold uppercase tracking-[0.2em]">
              <p className="text-muted-foreground/60">
                New researcher?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary/70 transition-colors"
                >
                  Create Identity
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
