"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileText, Upload } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { TranslationKeys } from "@/lib/translations/en";
import { useReducedMotion } from "@/lib/hooks/use-media-query";
import { cn, fill } from "@/lib/utils";

type Copy = TranslationKeys["landing"];

/** How long auto-play shows each step. */
export const STEP_MS = 4500;

/**
 * "Notes in. Mastery out.": three steps beside one product panel. Pointing at,
 * focusing or tapping a step shows its screen. Until the visitor does, the
 * steps play through on their own while the section is on screen (never with
 * reduced motion), with a line under the current step counting down.
 */
export function HowItWorks() {
  const { t } = useLanguage();
  const l = t.landing;
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const [inView, setInView] = useState(false);

  const playing = !touched && !reducedMotion && inView;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setActive((a) => (a + 1) % 3), STEP_MS);
    return () => clearInterval(timer);
  }, [playing]);

  const choose = (index: number) => {
    setActive(index);
    setTouched(true);
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="how-it-works-title"
      className="border-t border-border"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-12 px-6 py-24 md:py-32 lg:gap-20 lg:px-8">
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-10">
          <div className="space-y-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground">
              {l.howEyebrow}
            </p>
            <h2
              id="how-it-works-title"
              className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-[3.25rem]"
            >
              {l.howTitle}
              <br />
              <span className="text-subtle-foreground">{l.howHighlight}</span>
            </h2>
          </div>

          <ol className="border-t border-border">
            {l.steps.map((step, index) => {
              const on = index === active;
              return (
                <li key={step.title} className="relative border-b border-border">
                  <button
                    type="button"
                    aria-pressed={on}
                    onMouseEnter={() => choose(index)}
                    onFocus={() => choose(index)}
                    onClick={() => choose(index)}
                    className="flex w-full cursor-pointer gap-5 py-5 text-left"
                  >
                    <span
                      className={cn(
                        "w-6 pt-0.5 text-sm font-semibold tabular-nums transition-colors duration-300",
                        on ? "text-primary" : "text-subtle-foreground",
                      )}
                    >
                      0{index + 1}
                    </span>
                    <span className="flex flex-col gap-1">
                      <span
                        className={cn(
                          "text-[17px] font-semibold transition-colors duration-300",
                          on ? "text-foreground" : "text-subtle-foreground",
                        )}
                      >
                        {step.title}
                      </span>
                      <span
                        className={cn(
                          "text-[15px] leading-relaxed transition-colors duration-300",
                          on ? "text-muted-foreground" : "text-subtle-foreground",
                        )}
                      >
                        {step.desc}
                      </span>
                    </span>
                  </button>
                  {on && (
                    // Remounted per step, so the countdown restarts each time.
                    <span
                      key={`${active}-${playing}`}
                      aria-hidden="true"
                      className={cn(
                        "absolute -bottom-px left-0 block h-0.5 bg-primary",
                        playing ? "animate-landing-step" : "w-full",
                      )}
                      style={playing ? { animationDuration: `${STEP_MS}ms` } : undefined}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="min-w-0 flex-[999_1_560px]">
          <div
            data-testid="how-it-works-panel"
            className="flex min-h-[540px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-raised"
          >
            <div
              key={active}
              className="flex flex-1 flex-col animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {active === 0 && <UploadPanel l={l} />}
              {active === 1 && <DraftPanel l={l} />}
              {active === 2 && <TrackPanel l={l} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PanelHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-surface-sunken px-6 py-4">
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="text-[13px] text-muted-foreground">{detail}</span>
    </div>
  );
}

/** Illustration only: these controls do nothing, so they are not focusable. */
function PanelFooter({ secondary, primary }: { secondary: string; primary: string }) {
  return (
    <div aria-hidden="true" className="mt-auto flex flex-wrap justify-end gap-2.5 border-t border-border px-6 py-4">
      <span className="inline-flex h-[38px] items-center rounded-lg border border-border-strong bg-surface px-3.5 text-sm font-medium text-foreground">
        {secondary}
      </span>
      <span className="inline-flex h-[38px] items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground">
        {primary}
      </span>
    </div>
  );
}

function UploadPanel({ l }: { l: Copy }) {
  return (
    <>
      <PanelHeader title={`${l.uploadHeader} · Biology 101`} detail={fill(l.stepOf, { n: 1 })} />
      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8">
        <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-dashed border-border-strong bg-surface-sunken p-6 text-center">
          <Upload className="h-7 w-7 text-primary" aria-hidden="true" />
          <span className="text-base font-semibold text-foreground">{l.uploadDrop}</span>
          <span className="text-sm text-muted-foreground">{l.uploadHint}</span>
        </div>
        <div className="flex items-center gap-3.5 rounded-lg border border-border px-4 py-3.5">
          <FileText className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex justify-between gap-3 text-sm">
              <span className="truncate font-medium text-foreground">biology-week-7.pdf</span>
              <span className="shrink-0 text-muted-foreground">{l.uploadReading}</span>
            </div>
            <span className="block h-1 rounded-full bg-border">
              <span className="block h-full w-[72%] rounded-full bg-primary animate-landing-fill" />
            </span>
          </div>
        </div>
      </div>
      <PanelFooter secondary={l.uploadAnother} primary={l.uploadGenerate} />
    </>
  );
}

function DraftPanel({ l }: { l: Copy }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface-sunken px-6 py-4">
        <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          biology-week-7.pdf
        </span>
        <span className="flex min-w-[180px] flex-[0_1_240px] items-center gap-2.5">
          <span className="whitespace-nowrap text-[13px] text-muted-foreground">{l.draftHeader}</span>
          <span className="block h-1 flex-1 rounded-full bg-border">
            <span className="block h-full w-2/3 rounded-full bg-primary" />
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex justify-between gap-3 text-[13px] text-muted-foreground">
          <span>{l.draftLabel}</span>
          <span>{l.draftSource}</span>
        </div>
        <p className="text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-[22px]">
          {l.draftQuestion}
        </p>
        <ul className="flex flex-col gap-2">
          {l.draftOptions.map((option, index) =>
            index === 0 ? (
              <li
                key={option}
                className="flex items-center gap-3 rounded-lg border border-success-border bg-success-subtle px-3.5 py-3 text-[15px] font-medium text-foreground"
              >
                <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                {option}
                <span className="ml-auto text-xs text-success">{l.draftCorrect}</span>
              </li>
            ) : (
              <li
                key={option}
                className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-3 text-[15px] text-muted-foreground"
              >
                <span className="w-4 text-center text-xs font-semibold" aria-hidden="true">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </li>
            ),
          )}
        </ul>
      </div>
      <PanelFooter secondary={l.draftEdit} primary={l.draftApprove} />
    </>
  );
}

const WEEKS = [52, 61, 58, 70, 76, 81];

function TrackPanel({ l }: { l: Copy }) {
  return (
    <>
      <PanelHeader title={`Biology 101 · ${l.trackHeader}`} detail={fill(l.stepOf, { n: 3 })} />
      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8">
        <div className="flex items-center gap-3.5 rounded-lg border border-success-border bg-success-subtle px-4 py-3.5">
          <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-foreground">{l.trackCorrect}</span>
            <span className="text-[13px] text-muted-foreground">{l.trackStudentView}</span>
          </span>
          <span className="ml-auto text-[15px] font-semibold text-success">+10</span>
        </div>
        <div className="flex flex-1 flex-col gap-3.5 rounded-xl border border-border p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-muted-foreground">{l.trackChart}</span>
            <span className="text-[26px] font-semibold tracking-tight text-foreground">81%</span>
          </div>
          <div className="flex min-h-[140px] flex-1 items-end gap-3" aria-hidden="true">
            {WEEKS.map((value, index) => (
              <span
                key={index}
                className={cn(
                  "block flex-1 rounded-t-[4px] animate-landing-rise",
                  index === WEEKS.length - 1 ? "bg-primary" : "bg-primary/25",
                )}
                style={{ height: `${value}%`, animationDelay: `${index * 60}ms` }}
              />
            ))}
          </div>
          <div className="flex gap-3 text-[11px] text-muted-foreground" aria-hidden="true">
            {WEEKS.map((_, index) => (
              <span
                key={index}
                className={cn(
                  "flex-1 text-center",
                  index === WEEKS.length - 1 && "font-semibold text-foreground",
                )}
              >
                {l.trackWeek}
                {index + 1}
              </span>
            ))}
          </div>
        </div>
      </div>
      <PanelFooter secondary={l.trackShare} primary={l.trackAnalytics} />
    </>
  );
}
