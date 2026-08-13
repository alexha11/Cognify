import * as React from "react";
import { Check, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product previews for the landing page feature cards.
 *
 * These replaced four stock PNGs of unrelated, invented products — misleading
 * on our own marketing page, ~2MB of assets, and locked to a single theme.
 * Building them from the same tokens as the real UI means they show the actual
 * Cognify design language and follow light/dark.
 *
 * Each preview shows ONE idea, in as few elements as it takes. An earlier pass
 * tried to depict a whole workflow per card — source file, progress bar, chunk
 * list, hint, footer summary — and the reader had to study it. A landing page
 * gets a glance, so anything that is not the single point has been cut.
 *
 * PALETTE: near-monochrome. Hierarchy comes from weight and the surface ramp.
 * Colour appears in exactly one place, the quiz right/wrong marks, where it is
 * the actual information.
 *
 * Content is illustrative sample data, not a claim about a real account.
 */

function Pane({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-center gap-3 overflow-hidden bg-surface-sunken p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface px-3.5 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Option row shared by the generation and quiz previews. */
function Option({
  label,
  state = "idle",
  letter,
}: {
  label: string;
  state?: "idle" | "correct" | "wrong";
  letter?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-xs font-medium",
          state === "correct" && "border-success bg-success text-success-foreground",
          state === "wrong" && "border-error bg-error text-error-foreground",
          state === "idle" && "border-border-strong text-subtle-foreground",
        )}
      >
        {state === "correct"
          ? <Check className="h-3 w-3" />
          : state === "wrong"
          ? <X className="h-3 w-3" />
          : letter}
      </span>
      <span
        className={cn(
          "truncate text-sm",
          state === "idle" ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}

/* ── 1. Question generation: a document becomes a question. ────────────── */

export function AiGenerationPreview() {
  return (
    <Pane>
      <Card className="flex items-center gap-2.5">
        <FileText className="h-4 w-4 shrink-0 text-subtle-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          renewable-energy-ch3.pdf
        </span>
        <span className="shrink-0 text-sm text-muted-foreground">
          12 questions
        </span>
      </Card>

      <Card className="space-y-3 py-4">
        <p className="text-sm leading-relaxed text-foreground">
          Which renewable source produced the most electricity in 2023?
        </p>
        <div className="space-y-2">
          <Option label="Hydropower" state="correct" />
          <Option label="Solar PV" letter="B" />
          <Option label="Wind" letter="C" />
        </div>
      </Card>
    </Pane>
  );
}

/* ── 2. Analytics: one number, one trend. ──────────────────────────────── */

const BARS = [42, 58, 47, 71, 63, 84, 76, 92];

export function AnalyticsPreview() {
  return (
    <Pane>
      <Card className="flex h-full flex-col gap-4 py-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Average score</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              78.4%
            </p>
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            +3.2%
          </span>
        </div>

        {/* Neutral ramp — the current week is simply the most solid bar. */}
        <div className="flex min-h-0 flex-1 items-end gap-2">
          {BARS.map((h, i) => (
            <div key={i} className="flex h-full flex-1 items-end">
              <div
                className={cn(
                  "w-full rounded-t-sm",
                  i === BARS.length - 1
                    ? "bg-foreground/70"
                    : "bg-foreground/15",
                )}
                style={{ height: `${h}%` }}
              />
            </div>
          ))}
        </div>
      </Card>
    </Pane>
  );
}

/* ── 3. Document processing: a file becomes retrievable pieces. ────────── */

export function ProcessingPreview() {
  return (
    <Pane>
      <Card className="flex items-center gap-2.5">
        <FileText className="h-4 w-4 shrink-0 text-subtle-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          lecture-notes-week-7.pdf
        </span>
        <span className="shrink-0 text-sm text-muted-foreground">Indexed</span>
      </Card>

      <div className="space-y-2">
        {[
          "Photosynthesis converts light energy…",
          "The Calvin cycle fixes carbon dioxide…",
          "Chlorophyll absorbs red and blue…",
        ].map((text, i) => (
          <Card key={i} className="flex items-center gap-3 py-2.5">
            <span className="shrink-0 font-mono text-xs text-subtle-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {text}
            </span>
          </Card>
        ))}
      </div>
    </Pane>
  );
}

/* ── 4. Quiz: answer, and know immediately. ────────────────────────────── */

export function QuizPreview() {
  return (
    <Pane>
      <Card className="space-y-3 py-4">
        <p className="text-sm leading-relaxed text-foreground">
          What is the time complexity of binary search?
        </p>
        <div className="space-y-2">
          <Option label="O(log n)" state="correct" />
          <Option label="O(n)" state="wrong" />
          <Option label="O(n log n)" letter="C" />
        </div>
      </Card>

      <p className="px-1 text-sm text-muted-foreground">
        Question 4 of 10 · 180 pts
      </p>
    </Pane>
  );
}
