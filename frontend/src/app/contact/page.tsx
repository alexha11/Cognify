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
import { AmbientLights, SectionLightDivider } from "@/components/ui/ambient-lights";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";

const categories = [
  { id: "technical", label: "Technical Issue", icon: Bug },
  { id: "course", label: "Course & Quiz Help", icon: BookOpen },
  { id: "account", label: "Account & Access", icon: User },
  { id: "feedback", label: "Feature Request", icon: Sparkles },
  { id: "other", label: "Other Inquiry", icon: HelpCircle },
];

export default function ContactPage() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("technical");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (fullName && !name) setName(fullName);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in your name, email, and message before submitting.");
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
      toast.success("Message sent! We have received your support request.");
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send message. Please try again."
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
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Student Support & Feedback</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
              We're here to <span className="text-muted-foreground/60">help.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-normal">
              Have a question about Cognify, encountering a technical issue, or want to connect? Reach out using the form below or connect directly via LinkedIn.
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
                      Message Received!
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Thank you for contacting us, <span className="text-foreground font-medium">{name}</span>. Your inquiry regarding <span className="text-foreground font-medium">{categories.find(c => c.id === category)?.label}</span> has been logged. We'll reply to <span className="text-foreground font-medium">{email}</span> as quickly as possible.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground tracking-tight">
                      Send a Message
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fill in the details and we'll reply directly to your email.
                    </p>
                  </div>

                  {/* Name & Email inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground/80">
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground/80">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@student.edu"
                        className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80">
                      What can we help you with?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = category === cat.id;
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all duration-200 ${
                              isSelected
                                ? "border-primary bg-primary/10 text-foreground font-semibold shadow-sm"
                                : "border-border/60 bg-background/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground/70"}`} />
                            <span className="truncate">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80">
                      Message Details <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your question, bug details, or feedback here..."
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-y min-h-[120px]"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Sending message...</span>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Message</span>
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
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-400">
                    <Linkedin className="h-3 w-3" />
                    <span>Direct Professional Messaging</span>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground">
                    Connect on LinkedIn
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Prefer direct networking or messaging? Connect directly on LinkedIn for quick responses, course guidance, or career discussions.
                  </p>

                  <a
                    href="https://www.linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-all shadow-md group/btn"
                  >
                    <span className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      Reach out on LinkedIn
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </a>
                </div>
              </div>

              {/* Email & Info Cards */}
              <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-6 space-y-5 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Direct Email Support
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Send your questions directly to our support inbox.
                    </p>
                    <a
                      href="mailto:support@cognify.edu"
                      className="inline-block mt-2 text-xs font-mono font-medium text-primary hover:underline"
                    >
                      support@cognify.edu
                    </a>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Response Expectation
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      We aim to respond to all student messages within 24 hours on business days.
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Student Data Privacy
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your messages and contact info are strictly confidential and used solely for addressing your request.
                    </p>
                  </div>
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
            © 2026 Cognify. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/courses" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">
              Courses
            </Link>
            <Link href="/contact" className="text-xs text-foreground font-medium transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
