"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { cn, fill } from "@/lib/utils";

/**
 * "Answer one. No account needed." A short demo quiz graded in the browser.
 * The questions are sample content written for this page, not course data,
 * so there is no answer key to protect; it also keeps the landing page free of
 * the quiz page's markdown and maths code.
 */
export function TryIt() {
  const { t } = useLanguage();
  const l = t.landing;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const question = l.demo[index];
  const last = index === l.demo.length - 1;
  const right = checked && picked === question.correct;

  const check = () => {
    if (picked === null) return;
    setChecked(true);
    if (picked === question.correct) setScore((s) => s + 10);
  };

  const next = () => {
    setPicked(null);
    setChecked(false);
    if (last) {
      setIndex(0);
      setScore(0);
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <section aria-labelledby="try-it-title" className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-12 px-6 pb-28 pt-24 md:pb-36 md:pt-32 lg:gap-20 lg:px-8">
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground">
            {l.tryEyebrow}
          </p>
          <h2
            id="try-it-title"
            className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-[3.25rem]"
          >
            {l.tryTitle}
            <br />
            <span className="text-subtle-foreground">{l.tryHighlight}</span>
          </h2>
          <p className="max-w-md text-[17px] leading-relaxed text-muted-foreground">{l.tryBody}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/register">{l.tryCreate}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">{l.tryBrowse}</Link>
            </Button>
          </div>
        </div>

        <div className="min-w-0 flex-[999_1_520px]">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-raised sm:p-8">
            <div className="flex justify-between gap-3 text-[13px] text-muted-foreground">
              <span>{question.subject}</span>
              <span>{fill(l.tryProgress, { n: index + 1, total: l.demo.length, score })}</span>
            </div>
            <p className="min-h-14 text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-[22px]">
              {question.text}
            </p>

            <div className="flex flex-col gap-2" role="group" aria-label={question.text}>
              {question.options.map((option, i) => {
                const isCorrect = checked && i === question.correct;
                const isWrong = checked && i === picked && !isCorrect;
                const isPicked = !checked && i === picked;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={i === picked}
                    disabled={checked}
                    onClick={() => setPicked(i)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3.5 rounded-lg border px-3.5 py-3 text-left text-[15px] transition-colors disabled:cursor-default",
                      isCorrect && "border-success-border bg-success-subtle font-medium text-foreground",
                      isWrong && "border-error-border bg-error-subtle text-foreground",
                      isPicked && "border-primary bg-primary-subtle text-foreground",
                      !isCorrect && !isWrong && !isPicked && "border-border bg-surface text-foreground hover:bg-surface-hover",
                      checked && !isCorrect && !isWrong && "text-muted-foreground",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                        isCorrect && "bg-success text-success-foreground",
                        isWrong && "bg-error text-error-foreground",
                        isPicked && "bg-primary text-primary-foreground",
                        !isCorrect && !isWrong && !isPicked && "border border-border-strong text-muted-foreground",
                      )}
                    >
                      {isCorrect ? <Check className="h-3.5 w-3.5" /> : isWrong ? <X className="h-3.5 w-3.5" /> : String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="mt-1 flex min-h-11 flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p role="status" className={cn("text-sm font-semibold", checked ? (right ? "text-success" : "text-error") : "font-normal text-muted-foreground")}>
                {checked
                  ? right
                    ? l.tryCorrect
                    : fill(l.tryWrong, { answer: question.options[question.correct] })
                  : l.tryPick}
              </p>
              {checked ? (
                <Button variant="outline" onClick={next}>
                  {last ? l.tryAgain : l.tryNext}
                </Button>
              ) : (
                <Button onClick={check} disabled={picked === null}>
                  {l.tryCheck}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
