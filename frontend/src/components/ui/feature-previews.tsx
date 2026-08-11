import * as React from "react";
import {
  BarChart3,
  Check,
  FileText,
  Lightbulb,
  Sparkles,
  Timer,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product previews for the landing page feature cards.
 *
 * These replaced four stock PNGs that showed mockups of unrelated, invented
 * products — misleading on our own marketing page, ~2MB of assets, and locked
 * to a single theme. Building them from the same tokens as the real UI means
 * they show the actual Cognify design language and follow light/dark.
 *
 * PALETTE: deliberately near-monochrome. Hierarchy is carried by weight and by
 * the surface ramp, not by hue — an earlier pass tinted every block (violet
 * hints, green "indexed", a red/amber/green difficulty row) and the result read
 * as noisy rather than considered. Colour is now spent in exactly one place,
 * the quiz right/wrong marks, where it is the actual information.
 *
 * The content is illustrative sample data, not a claim about a real account.
 */

/** The pane a preview is drawn on — one step below the card surface. */
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
        "flex h-full w-full flex-col gap-3 overflow-hidden bg-surface-sunken p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Row({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface px-3 py-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── 1. AI question generation ─────────────────────────────────────────── */

export function AiGenerationPreview() {
  return (
    <Pane>
      <Row className="flex items-center gap-2.5">
        <FileText className="h-4 w-4 shrink-0 text-subtle-foreground" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          renewable-energy-ch3.pdf
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">18 pages</span>
      </Row>

      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-subtle-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Generated 12 questions
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Row className="space-y-2.5">
        <p className="text-xs leading-relaxed font-medium text-foreground">
          Which renewable source accounted for the largest share of global
          electricity in 2023?
        </p>
        <div className="space-y-1.5">
          {[
            { label: "Hydropower", correct: true },
            { label: "Solar PV", correct: false },
            { label: "Wind", correct: false },
          ].map((o) => (
            <div key={o.label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                  o.correct
                    ? "border-foreground bg-foreground text-background"
                    : "border-border-strong",
                )}
              >
                {o.correct && <Check className="h-2.5 w-2.5" />}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  o.correct
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {o.label}
              </span>
            </div>
          ))}
        </div>
      </Row>

      <Row className="flex items-center gap-2">
        <Lightbulb className="h-3.5 w-3.5 shrink-0 text-subtle-foreground" />
        <span className="truncate text-xs text-muted-foreground">
          Hint: see §3.2, global generation mix
        </span>
      </Row>
    </Pane>
  );
}

/* ── 2. Assessment / analytics ─────────────────────────────────────────── */

const BARS = [42, 58, 47, 71, 63, 84, 76, 92];

export function AnalyticsPreview() {
  return (
    <Pane>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Avg. score", value: "78.4%", icon: TrendingUp },
          { label: "Attempts", value: "6,211", icon: BarChart3 },
          { label: "Avg. time", value: "38m", icon: Timer },
        ].map((s) => (
          <Row key={s.label} className="px-2.5 py-2">
            <s.icon className="mb-1 h-3.5 w-3.5 text-subtle-foreground" />
            <p className="truncate text-xs text-muted-foreground">{s.label}</p>
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {s.value}
            </p>
          </Row>
        ))}
      </div>

      <Row className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-foreground">
            Weekly accuracy
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            +3.2%
          </span>
        </div>
        {/* A neutral ramp: the current week is simply the most solid bar. */}
        <div className="flex min-h-0 flex-1 items-end gap-1.5">
          {BARS.map((h, i) => (
            <div key={i} className="flex h-full flex-1 items-end">
              <div
                className={cn(
                  "w-full rounded-t-sm",
                  i === BARS.length - 1 ? "bg-foreground/70" : "bg-foreground/15",
                )}
                style={{ height: `${h}%` }}
              />
            </div>
          ))}
        </div>
      </Row>

      <div className="flex gap-1.5">
        {["Easy", "Medium", "Hard"].map((d) => (
          <span
            key={d}
            className="flex-1 rounded-full border border-border bg-surface px-2 py-1 text-center text-xs text-muted-foreground"
          >
            {d}
          </span>
        ))}
      </div>
    </Pane>
  );
}

/* ── 3. Document processing ────────────────────────────────────────────── */

export function ProcessingPreview() {
  return (
    <Pane>
      <Row className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-subtle-foreground" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
            lecture-notes-week-7.pdf
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            Indexed
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-full rounded-full bg-foreground/60" />
        </div>
      </Row>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden">
        {[
          { chunk: "chunk 01", text: "Photosynthesis converts light energy…" },
          { chunk: "chunk 02", text: "The Calvin cycle fixes carbon dioxide…" },
          { chunk: "chunk 03", text: "Chlorophyll absorbs red and blue…" },
        ].map((c) => (
          <Row key={c.chunk} className="flex items-center gap-2.5 py-2">
            <span className="shrink-0 rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              {c.chunk}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {c.text}
            </span>
          </Row>
        ))}
      </div>

      <Row className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-subtle-foreground" />
        <span className="truncate text-xs text-muted-foreground">
          384 embeddings ready for retrieval
        </span>
      </Row>
    </Pane>
  );
}

/* ── 4. Quiz experience ────────────────────────────────────────────────── */

export function QuizPreview() {
  return (
    <Pane>
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-foreground">Question 4 of 10</span>
          <span className="text-muted-foreground tabular-nums">180 pts</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-[40%] rounded-full bg-foreground/60" />
        </div>
      </div>

      <Row className="min-h-0 flex-1 space-y-2.5">
        <p className="text-xs leading-relaxed font-medium text-foreground">
          What is the time complexity of binary search on a sorted array?
        </p>
        <div className="space-y-1.5">
          {[
            { k: "A", label: "O(log n)", state: "correct" as const },
            { k: "B", label: "O(n)", state: "wrong" as const },
            { k: "C", label: "O(n log n)", state: "idle" as const },
          ].map((o) => (
            <div
              key={o.k}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2 py-1.5",
                // The only colour in the set, and only on the border — the
                // right/wrong marks are the information here.
                o.state === "correct" && "border-success-border",
                o.state === "wrong" && "border-error-border",
                o.state === "idle" && "border-border",
              )}
            >
              <span
                className={cn(
                  "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm border text-xs font-semibold",
                  o.state === "correct" &&
                    "border-success bg-success text-success-foreground",
                  o.state === "wrong" &&
                    "border-error bg-error text-error-foreground",
                  o.state === "idle" &&
                    "border-border-strong text-muted-foreground",
                )}
              >
                {o.state === "correct"
                  ? <Check className="h-2.5 w-2.5" />
                  : o.state === "wrong"
                  ? <X className="h-2.5 w-2.5" />
                  : o.k}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  o.state === "idle"
                    ? "text-muted-foreground"
                    : "font-medium text-foreground",
                )}
              >
                {o.label}
              </span>
            </div>
          ))}
        </div>
      </Row>

      <Row className="flex items-center gap-2">
        <Check className="h-3.5 w-3.5 shrink-0 text-success" />
        <span className="truncate text-xs text-muted-foreground">
          Correct — halving the range each step
        </span>
      </Row>
    </Pane>
  );
}
