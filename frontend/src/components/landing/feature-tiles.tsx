"use client";

import { useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { useLanguage } from "@/lib/i18n";
import { useReducedMotion } from "@/lib/hooks/use-media-query";

/**
 * Three features, each a one-line title over a small 3D scene built from CSS
 * transforms (no images, no WebGL). With a mouse, a tile tilts slightly toward
 * the pointer.
 */
export function FeatureTiles() {
  const { t } = useLanguage();
  const l = t.landing;

  return (
    <section aria-labelledby="features-title" className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-24 md:py-32 lg:px-8">
        <div className="space-y-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground">
            {l.featuresEyebrow}
          </p>
          <h2
            id="features-title"
            className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-[3.25rem]"
          >
            {l.featuresTitle}
            <br />
            <span className="text-subtle-foreground">{l.featuresHighlight}</span>
          </h2>
        </div>

        <div className="flex flex-wrap gap-5">
          <Tile title={l.tileQuiz}>
            <NotesToQuizScene />
          </Tile>
          <Tile title={l.tileStuck}>
            <AccuracyScene title={l.chartTitle} q={l.questionShort} />
          </Tile>
          <Tile title={l.tilePlay} alignEnd>
            <PhoneScene
              shuffled={l.tagShuffled}
              hints={l.tagHints}
              leaderboard={l.tagLeaderboard}
            />
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({
  title,
  alignEnd,
  children,
}: {
  title: string;
  alignEnd?: boolean;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0, on: false });

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || reducedMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (0.5 - py) * 4, y: (px - 0.5) * 5, on: true });
  };

  // A scene box narrower than ~320px (phones, three tiles on a small laptop)
  // is a container query away from shrinking its scene: --scene-scale scales
  // the scene inside its 3D transform, so the perspective stays intact.
  return (
    <article
      onPointerMove={onPointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0, on: false })}
      className="flex h-[460px] min-w-0 flex-[1_1_300px] flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-card transition-[transform,box-shadow] ease-out"
      style={{
        transform: `perspective(1400px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`,
        transitionDuration: tilt.on ? "150ms" : "700ms",
        boxShadow: tilt.on ? "var(--shadow-raised)" : undefined,
      }}
    >
      <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      <div
        aria-hidden="true"
        className={`flex flex-1 justify-center overflow-hidden rounded-xl border border-border bg-surface-sunken @container ${alignEnd ? "items-end" : "items-center"}`}
        style={{ perspective: 1000 }}
      >
        {children}
      </div>
    </article>
  );
}

const sheetShadow = "0 24px 32px -18px rgb(0 0 0 / 0.25)";

/** A PDF page lying flat, with two question cards lifting off it. */
function NotesToQuizScene() {
  const card = (top: number, z: number, delay: string, pickFirst: boolean) => (
    <div
      className="absolute"
      style={{ left: 14 + (z > 80 ? 14 : 0), right: z > 80 ? 0 : 14, top, transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" }}
    >
      <div
        className="flex flex-col gap-1.5 rounded-lg border border-border-strong bg-surface p-2.5 animate-landing-lift"
        style={{ animationDelay: delay, boxShadow: sheetShadow }}
      >
        <span className="block h-1.5 w-4/5 rounded-sm bg-foreground" />
        <span className={`block h-3.5 rounded border border-border ${pickFirst ? "animate-landing-pick" : ""}`} />
        <span
          className={`block h-3.5 rounded border border-border ${pickFirst ? "" : "animate-landing-pick"}`}
          style={pickFirst ? undefined : { animationDelay: "-3s" }}
        />
      </div>
    </div>
  );

  return (
    <div
      className="relative @max-[20rem]:[--scene-scale:0.8]"
      style={{ width: 180, height: 240, transformStyle: "preserve-3d", transform: "scale(var(--scene-scale, 1)) rotateX(55deg) rotateZ(-35deg) translateY(16px)" }}
    >
      <div
        className="absolute inset-0 flex flex-col gap-2 rounded-lg border border-border-strong bg-surface p-4"
        style={{ boxShadow: sheetShadow }}
      >
        <span className="block h-2 w-[55%] rounded-sm bg-border-strong" />
        {[100, 90].map((w) => (
          <span key={w} className="block h-[5px] rounded-sm bg-border" style={{ width: `${w}%` }} />
        ))}
        <span className="block h-3 w-full rounded-sm bg-primary/20" />
        {[94, 76, 88].map((w) => (
          <span key={w} className="block h-[5px] rounded-sm bg-border" style={{ width: `${w}%` }} />
        ))}
      </div>
      {card(30, 60, "0s", true)}
      {card(108, 118, "-2s", false)}
    </div>
  );
}

const BARS = [90, 78, 36, 72, 84];

/** A tilted chart; the question the class struggles with stands out. */
function AccuracyScene({ title, q }: { title: string; q: string }) {
  return (
    <div className="@max-[20rem]:[--scene-scale:0.8]" style={{ width: 230, transform: "scale(var(--scene-scale, 1)) rotateX(14deg) rotateY(-20deg)" }}>
      <div
        className="flex flex-col gap-3 rounded-xl border border-border-strong bg-surface p-4"
        style={{ boxShadow: "0 28px 36px -22px rgb(0 0 0 / 0.25)" }}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          <span className="text-xs font-semibold text-warning">{q}3 · 38%</span>
        </div>
        <div className="flex h-[120px] items-end gap-2.5">
          {BARS.map((height, index) => (
            <span
              key={index}
              className={`block flex-1 rounded-t-[4px] animate-landing-grow ${index === 2 ? "bg-warning" : "bg-primary"}`}
              style={{ height: `${height}%`, animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
        <div className="flex gap-2.5 text-[11px] text-muted-foreground">
          {BARS.map((_, index) => (
            <span key={index} className={`flex-1 text-center ${index === 2 ? "font-semibold text-warning" : ""}`}>
              {q}
              {index + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const tagClass =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border-strong bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground animate-landing-float";

/** A phone showing a quiz, with three small labels at different depths. */
function PhoneScene({ shuffled, hints, leaderboard }: { shuffled: string; hints: string; leaderboard: string }) {
  const tag = (label: string, dot: string, style: CSSProperties, delay: string) => (
    <div className="absolute" style={style}>
      <span className={tagClass} style={{ animationDelay: delay, boxShadow: "0 8px 16px -10px rgb(0 0 0 / 0.3)" }}>
        <span className={`block h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    </div>
  );

  return (
    <div
      className="relative @max-[20rem]:[--scene-scale:0.8]"
      style={{
        width: 150,
        height: 270,
        transformStyle: "preserve-3d",
        // The first shift keeps a scaled-down phone on the bottom edge.
        transform:
          "translateY(calc((1 - var(--scene-scale, 1)) * 135px)) scale(var(--scene-scale, 1)) rotateY(-20deg) rotateX(8deg) translateY(44px)",
      }}
    >
      <div
        className="absolute inset-0 flex flex-col gap-[7px] rounded-[26px] border-[5px] border-[#2e2e2c] bg-[#1c1917] px-2.5 pb-2.5 pt-[22px]"
        style={{ boxShadow: "18px 30px 40px -20px rgb(0 0 0 / 0.35)" }}
      >
        <span className="block h-1.5 w-[84%] rounded-sm bg-[#fafaf9]" />
        <span className="mb-1 block h-1.5 w-[58%] rounded-sm bg-[#fafaf9]" />
        <span className="block h-[22px] rounded-md border border-[#414140]" />
        <span className="block h-[22px] rounded-md border border-[#34d399] bg-[#0c1f18]" />
        <span className="block h-[22px] rounded-md border border-[#414140]" />
      </div>
      {tag(shuffled, "bg-primary", { left: -78, top: 34, transform: "translateZ(50px)" }, "0s")}
      {tag(hints, "bg-warning", { right: -54, top: 96, transform: "translateZ(70px)" }, "-2s")}
      {tag(leaderboard, "bg-success", { left: -66, top: 156, transform: "translateZ(60px)" }, "-4s")}
    </div>
  );
}
