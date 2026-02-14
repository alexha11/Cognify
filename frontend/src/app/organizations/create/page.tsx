"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { apiPost } from "@/lib/api";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const createOrgSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type CreateOrgFormValues = z.infer<typeof createOrgSchema>;

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { user } = useAuth(); // We might need to refresh user to get the new organizationId
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgSchema),
  });

  const onSubmit = async (values: CreateOrgFormValues) => {
    setError("");
    try {
      await apiPost("/organizations", values);
      // Force a hard refresh or update auth context (for now, router push might be enough if we handle auth state update)
      // Since organizationId is in the token, we might need re-login or profile fetch.
      // For now, let's redirect to dashboard which might refetch profile if set up that way,
      // or to the new org page.
      // Ideally, we should refresh the user token.

      // Redirecting to dashboard triggers a check, but token is stale.
      // A full page reload might be safest for now to clear/refresh state if implemented.
      // But let's just go to organizations list.
      router.push("/organizations");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create organization");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-6">
        <Link
          href="/organizations"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <Card className="border border-border p-1">
            <CardHeader className="text-center pt-10 pb-8">
              <div className="mx-auto w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6">
                <Building2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                Create Organization
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                Establish a new educational space for your courses and students.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="gap-6 flex flex-col"
              >
                {error && (
                  <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-xs font-medium text-destructive text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-xs font-medium text-muted-foreground ml-1"
                    >
                      Organization Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. Cognitive Science Institute"
                      {...register("name")}
                      className={`h-11 rounded-xl text-sm ${errors.name ? "border-destructive/40 focus:ring-destructive/5" : ""}`}
                    />
                    {errors.name && (
                      <p className="text-xs font-medium text-destructive ml-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-xs font-medium text-muted-foreground ml-1"
                    >
                      Description (Optional)
                    </Label>
                    <Input
                      id="description"
                      placeholder="A brief overview of your institution..."
                      {...register("description")}
                      className="h-11 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="logoUrl"
                      className="text-xs font-medium text-muted-foreground ml-1"
                    >
                      Logo URL (Optional)
                    </Label>
                    <Input
                      id="logoUrl"
                      placeholder="https://example.com/logo.png"
                      {...register("logoUrl")}
                      className={`h-11 rounded-xl text-sm ${errors.logoUrl ? "border-destructive/40 focus:ring-destructive/5" : ""}`}
                    />
                    {errors.logoUrl && (
                      <p className="text-xs font-medium text-destructive ml-1">
                        {errors.logoUrl.message}
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
                    "Create Organization"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
