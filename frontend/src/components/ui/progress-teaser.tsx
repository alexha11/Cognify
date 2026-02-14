"use client";

import {
  BarChart3,
  TrendingUp,
  Check,
  Lock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "./card";
import { FeatureGate } from "./feature-gate";
import { Badge } from "./badge";
import { Button } from "./button";

export function ProgressTeaser() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Blurred Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 opacity-40 filter blur-[2px] pointer-events-none select-none grayscale-50">
        {[
          { label: "Synthesis Volume", value: "128", icon: BarChart3 },
          { label: "Successful Identifications", value: "115", icon: Check },
          { label: "Accuracy Threshold", value: "92%", icon: TrendingUp },
        ].map((stat, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-widest"
                >
                  Metrics
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {stat.label}
                </p>
                <p className="text-4xl font-semibold text-foreground tracking-tighter">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Teaser Section */}
      <FeatureGate
        variant="blur"
        title="Institutional Intelligence"
        description="Every assessment you complete contributes to your personalized learning profile. Join Cognify to archive your progression and unlock deep-dive analytics."
      >
        <div className="min-h-[450px] rounded-[40px] border-2 border-dashed border-border/60 bg-secondary/10 flex items-center justify-center p-12 text-center group transition-all duration-500 hover:bg-secondary/20">
          <div className="max-w-md space-y-8">
            <div className="mx-auto w-24 h-24 bg-primary/5 rounded-[32px] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-foreground tracking-tight">
                Visualize Your Intellect
              </h2>
              <p className="text-muted-foreground font-serif text-lg leading-relaxed">
                Track your performance across course pathways, identify
                cognitive gaps, and master any domain with data-driven
                synthesis.
              </p>
            </div>
            <Button variant="pill" size="xl" className="mt-4">
              Initialize Profile
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </FeatureGate>
    </div>
  );
}
