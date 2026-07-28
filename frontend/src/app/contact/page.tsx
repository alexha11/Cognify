"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  CheckCircle2,
  Linkedin,
  MessageSquare,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bug,
  BookOpen,
  User,
} from "lucide-react";
import { Header } from "@/components/layout";
import {
  AmbientLights,
  SectionLightDivider,
} from "@/components/ui/ambient-lights";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

const categories = [
  { id: "technical", label: "Technical Issue", icon: Bug },
  { id: "course", label: "Course & Quiz Help", icon: BookOpen },
  { id: "account", label: "Account & Access", icon: User },
  { id: "feedback", label: "Feature Request", icon: Sparkles },
  { id: "other", label: "Other Inquiry", icon: HelpCircle },
];

export default function ContactPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const co = t.contact;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("technical");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ");
      if (fullName && !name) setName(fullName);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(co.fillInFields);
      return;
    }

    setIsSubmitting(true);

    try {
      await apiPost("/contact", {
        name,
        email,
        category: categories.find((c) => c.id === category)?.label || category,
        message,
      });
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success(co.messageSent);
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send message. Please try again.",
      );
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setMessage("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 relative overflow-hidden">
      {/* Ambient glow backdrop */}
      <AmbientLights />

      {/* Dot texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <Header />

      <main className="flex-1 pt-14 pb-24 relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header Banner */}
          <div className="max-w-3xl mx-auto text-center pt-8 pb-12 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-xs font-semibold text-primary">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{co.badge}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
              {co.title}{" "}
              <span className="text-muted-foreground/60">{co.titleHighlight}</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-normal">
              {co.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-4">
            {/* Left Column: Contact Form */}
            <div className="lg:col-span-7 bg-card/60 backdrop-blur-md rounded-2xl border border-border/80 p-6 md:p-8 shadow-xl">
              {submitted ? (
                <div className="py-12 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-foreground">
                      {co.messageReceived}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      {co.thankYou}{" "}
                      <span className="text-foreground font-medium">{name}</span>
                      . {co.yourInquiry}{" "}
                      <span className="text-foreground font-medium">
                        {categories.find((c) => c.id === category)?.label}
                      </span>{" "}
                      {co.hasBeenLogged}{" "}
                      <span className="text-foreground font-medium">{email}</span>{" "}
                      {co.asQuicklyAsPossible}.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                    >
                      {co.sendAnother}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground tracking-tight">
                      {co.sendMessage}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {co.sendMessageDesc}
                    </p>
                  </div>

                  {/* Name & Email inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground/80">
                        {co.yourName} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={co.namePlaceholder}
                        className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground/80">
                        {co.emailAddress} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={co.emailPlaceholder}
                        className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80">
                      {co.whatCanWeHelp}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = category === cat.id;
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium text-left transition-all duration-200 cursor-pointer select-none ${
                              isSelected
                                ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold shadow-md ring-2 ring-violet-500/20 scale-[1.02]"
                                : "border-border/80 bg-secondary/30 text-muted-foreground hover:bg-violet-500/10 hover:text-foreground hover:border-violet-500/30"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 shrink-0 pointer-events-none ${
                                isSelected
                                  ? "text-violet-600 dark:text-violet-400"
                                  : "text-muted-foreground/70"
                              }`}
                            />
                            <span className="truncate pointer-events-none">
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80">
                      {co.messageDetails} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={co.messagePlaceholder}
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-y min-h-[120px]"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>{co.sendingMessage}</span>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{co.sendMessageBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: LinkedIn & Direct Support Options */}
            <div className="lg:col-span-5 space-y-6">
              {/* LinkedIn Connect Card */}
              <div className="group relative rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/30 via-card/80 to-card/60 p-6 shadow-xl backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-blue-500/50">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Linkedin className="h-28 w-28 text-blue-400" />
                </div>
                <div className="relative z-10 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    {co.connectLinkedIn}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {co.linkedInDesc}
                  </p>

                  <a
                    href="https://www.linkedin.com/in/duc-thanh-duong-ha/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-all shadow-md group/btn"
                  >
                    <span className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      {co.reachOutLinkedIn}
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <SectionLightDivider className="my-16" />
        </div>
      </main>

      <footer className="border-t border-border/30 z-10 relative">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 py-6 sm:flex-row">
          <p className="text-xs font-serif text-muted-foreground/50">
            {t.common.copyright}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              {co.home}
            </Link>
            <Link
              href="/courses"
              className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              {t.home.footerCourses}
            </Link>
            <Link
              href="/contact"
              className="text-xs text-foreground font-medium transition-colors"
            >
              {t.nav.contact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
