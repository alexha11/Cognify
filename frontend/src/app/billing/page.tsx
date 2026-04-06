"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import { SubscriptionStatus, Organization, PlanLimits } from "@/types";
import {
  CreditCard,
  Sparkles,
  Check,
  ArrowRight,
  Loader2,
  Zap,
  Shield,
  Crown,
  ExternalLink,
} from "lucide-react";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanOption {
  name: string;
  key: "FREE" | "PRO" | "ENTERPRISE";
  price: string;
  period: string;
  description: string;
  icon: typeof Sparkles;
  features: PlanFeature[];
  highlighted?: boolean;
}

const plans: PlanOption[] = [
  {
    name: "Free",
    key: "FREE",
    price: "$0",
    period: "forever",
    description: "Get started with the essentials for individual use.",
    icon: Zap,
    features: [
      { text: "Up to 3 courses", included: true },
      { text: "50 questions per course", included: true },
      { text: "5 team members", included: true },
      { text: "AI question generation", included: true },
      { text: "Advanced analytics", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    key: "PRO",
    price: "$29",
    period: "per month",
    description: "Ideal for growing teams and institutions.",
    icon: Shield,
    highlighted: true,
    features: [
      { text: "Unlimited courses", included: true },
      { text: "500 questions per course", included: true },
      { text: "50 team members", included: true },
      { text: "AI question generation", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Enterprise",
    key: "ENTERPRISE",
    price: "$99",
    period: "per month",
    description: "Full-scale deployment with dedicated infrastructure.",
    icon: Crown,
    features: [
      { text: "Unlimited courses", included: true },
      { text: "Unlimited questions", included: true },
      { text: "Unlimited members", included: true },
      { text: "AI question generation", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

export default function BillingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null,
  );
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user || user.role !== "ADMIN") return;
      try {
        const [subData, orgData, limitsData] = await Promise.all([
          apiGet<SubscriptionStatus>("/billing/status").catch(() => null),
          apiGet<Organization>("/organizations/me").catch(() => null),
          apiGet<PlanLimits>("/organizations/limits").catch(() => null),
        ]);
        if (subData) setSubscription(subData);
        if (orgData) setOrganization(orgData);
        if (limitsData) setLimits(limitsData);
      } catch (error) {
        console.error("Failed to fetch billing data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading]);

  const handleCheckout = async (plan: "PRO" | "ENTERPRISE") => {
    setIsCheckoutLoading(plan);
    try {
      const data = await apiPost<{ url: string }>("/billing/checkout", {
        plan,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing?canceled=true`,
      });
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to create checkout", error);
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    try {
      const data = await apiPost<{ url: string }>("/billing/portal", {
        returnUrl: window.location.href,
      });
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to open portal", error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  const currentPlan = subscription?.plan || organization?.plan || "FREE";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <CreditCard className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  Billing & Plans
                </h1>
                <p className="text-muted-foreground font-serif text-lg leading-relaxed">
                  Manage your subscription and access premium capabilities.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="px-4 py-1.5 h-fit text-[10px] font-bold uppercase tracking-widest bg-primary/5"
            >
              {currentPlan} Plan
            </Badge>
            {subscription?.subscription && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={handlePortal}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Manage Subscription
              </Button>
            )}
          </div>
        </div>

        {/* Current Usage */}
        {limits && (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Current Usage
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  label: "Courses",
                  current: organization?.courseCount || 0,
                  max: limits.maxCourses,
                  icon: Sparkles,
                },
                {
                  label: "Questions",
                  current: "—",
                  max: limits.maxQuestions,
                  icon: CreditCard,
                },
                {
                  label: "Members",
                  current: organization?.userCount || 0,
                  max: limits.maxUsers,
                  icon: Shield,
                },
              ].map((item, i) => {
                const pct =
                  typeof item.current === "number" && item.max > 0
                    ? Math.min(Math.round((item.current / item.max) * 100), 100)
                    : 0;
                return (
                  <Card
                    key={i}
                    className="hover:bg-secondary/20 transition-all duration-300"
                  >
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.current} / {item.max === -1 ? "∞" : item.max}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                          {item.label}
                        </p>
                        {item.max > 0 && typeof item.current === "number" && (
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                  pct >= 90 ? "bg-destructive" : "bg-primary"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {pct}% used
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Plans */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Available Plans
            </h2>
            <div className="h-[1px] flex-1 mx-8 bg-border/40" />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.key;
              return (
                <Card
                  key={plan.key}
                  className={`relative flex flex-col transition-all duration-300 ${
                    plan.highlighted
                      ? "border-primary/30 shadow-lg shadow-primary/5"
                      : ""
                  } ${isCurrent ? "bg-secondary/20" : "hover:bg-secondary/10"}`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary/5 text-primary">
                        <plan.icon className="h-6 w-6" />
                      </div>
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase tracking-widest"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-semibold tracking-tight">
                      {plan.name}
                    </CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-semibold tracking-tighter text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground font-serif">
                        /{plan.period}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground font-serif leading-relaxed">
                      {plan.description}
                    </p>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 flex-1 flex flex-col">
                    <div className="space-y-3 flex-1">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className={`h-5 w-5 flex items-center justify-center rounded-full ${
                              feature.included
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary text-muted-foreground/30"
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <span
                            className={`text-sm ${
                              feature.included
                                ? "text-foreground"
                                : "text-muted-foreground/50 line-through"
                            }`}
                          >
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8">
                      {isCurrent ? (
                        <Button
                          variant="outline"
                          className="w-full rounded-xl"
                          disabled
                        >
                          Current Plan
                        </Button>
                      ) : plan.key === "FREE" ? (
                        <Button
                          variant="outline"
                          className="w-full rounded-xl"
                          disabled
                        >
                          Free Tier
                        </Button>
                      ) : (
                        <Button
                          variant={plan.highlighted ? "default" : "outline"}
                          className={`w-full rounded-xl ${
                            plan.highlighted ? "" : ""
                          }`}
                          onClick={() =>
                            handleCheckout(plan.key as "PRO" | "ENTERPRISE")
                          }
                          disabled={isCheckoutLoading !== null}
                        >
                          {isCheckoutLoading === plan.key ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Upgrade to {plan.name}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Subscription Detail */}
        {subscription?.subscription && (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Subscription Details
            </h2>
            <Card className="hover:bg-secondary/20 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Current Period Ends
                    </p>
                    <p className="text-xl font-semibold tracking-tight text-foreground">
                      {new Date(
                        subscription.subscription.currentPeriodEnd,
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        subscription.subscription.status === "ACTIVE"
                          ? "default"
                          : "secondary"
                      }
                      className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                    >
                      {subscription.subscription.status}
                    </Badge>
                    {subscription.subscription.cancelAtPeriodEnd && (
                      <Badge
                        variant="outline"
                        className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-destructive border-destructive/30"
                      >
                        Cancels at period end
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
