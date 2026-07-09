"use client";

// ─── Cube geometry ────────────────────────────────────────────────────────────
const S = 220; // face size in px
const H = S / 2; // half = translateZ distance
const PAD = 10; // padding inside each face
const GAP = 5; // gap between stickers
const ST = (S - PAD * 2 - GAP * 2) / 3; // sticker size ≈ 63 px

// ─── Classic Rubik's cube colours ─────────────────────────────────────────────
const O = "#F97316"; // orange
const B = "#3B82F6"; // blue
const G = "#22C55E"; // green
const R = "#EF4444"; // red
const W = "#FAFAFA"; // white
const Y = "#EAB308"; // yellow

// 9 stickers per face (row-major 3×3). Lightly scrambled for visual interest.
const STICKERS: Record<string, string[]> = {
  front: [O, O, O, W, O, O, O, O, G],
  back: [B, B, B, B, B, B, B, B, B],
  right: [G, G, B, G, G, G, G, G, G],
  left: [R, R, R, R, R, R, R, R, R],
  top: [W, W, W, W, W, W, W, W, O],
  bottom: [Y, Y, Y, Y, Y, Y, Y, Y, Y],
};

// ─── 3D face transforms ───────────────────────────────────────────────────────
const TRANSFORMS: Record<string, string> = {
  front: `translateZ(${H}px)`,
  back: `rotateY(180deg) translateZ(${H}px)`,
  right: `rotateY(90deg) translateZ(${H}px)`,
  left: `rotateY(-90deg) translateZ(${H}px)`,
  top: `rotateX(90deg) translateZ(${H}px)`,
  bottom: `rotateX(-90deg) translateZ(${H}px)`,
};

// ─── Single face ──────────────────────────────────────────────────────────────
function Face({ face }: { face: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: TRANSFORMS[face],
        backgroundColor: "#111827",
        borderRadius: 14,
        padding: PAD,
        display: "grid",
        gridTemplateColumns: `repeat(3, ${ST}px)`,
        gridTemplateRows: `repeat(3, ${ST}px)`,
        gap: GAP,
        boxSizing: "border-box",
        border: "2px solid #1F2937",
      }}
    >
      {STICKERS[face].map((color, i) => (
        <div
          key={i}
          style={{
            backgroundColor: color,
            borderRadius: 5,
            // Subtle gloss effect on each sticker
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.40), " +
              "inset 0 -1px 0 rgba(0,0,0,0.20), " +
              "0 1px 3px rgba(0,0,0,0.35)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
export function RubiksCube() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 340,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "800px",
      }}
    >
      {/*
        Plain <style> (not styled-jsx) works in both Pages Router and App Router.
        All 3D transforms are inline — no class dependency for geometry.
      */}
      <style>{`
        @keyframes rubiks-float {
          0%   { transform: rotateX(-22deg) rotateY(0deg)   translateY(0px); }
          25%  { transform: rotateX(-28deg) rotateY(90deg)  translateY(-8px); }
          50%  { transform: rotateX(-22deg) rotateY(180deg) translateY(0px); }
          75%  { transform: rotateX(-16deg) rotateY(270deg) translateY(-8px); }
          100% { transform: rotateX(-22deg) rotateY(360deg) translateY(0px); }
        }
        .rubiks-cube-spin {
          animation: rubiks-float 20s linear infinite;
        }
        .rubiks-cube-spin:hover {
          animation-play-state: paused;
          cursor: grab;
        }
        @media (prefers-reduced-motion: reduce) {
          .rubiks-cube-spin {
            animation: none;
            transform: rotateX(-22deg) rotateY(-35deg);
          }
        }
      `}</style>

      <div style={{ position: "relative" }}>
        {/* Floating ground shadow */}
        <div
          style={{
            position: "absolute",
            bottom: -32,
            left: "50%",
            transform: "translateX(-50%)",
            width: S * 0.72,
            height: 28,
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.22) 0%, transparent 70%)",
            filter: "blur(8px)",
            pointerEvents: "none",
          }}
        />

        {/* The cube itself */}
        <div
          className="rubiks-cube-spin"
          style={{
            position: "relative",
            width: S,
            height: S,
            transformStyle: "preserve-3d",
          }}
        >
          {Object.keys(STICKERS).map((face) => (
            <Face key={face} face={face} />
          ))}
        </div>
      </div>
    </div>
  );
}
