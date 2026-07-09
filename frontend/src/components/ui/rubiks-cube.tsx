const STICKERS = Array.from({ length: 9 });

type Face = "front" | "back" | "left" | "right" | "top" | "bottom";
const FACES: Face[] = ["front", "back", "right", "left", "top", "bottom"];

function CubeFace({ position }: { position: Face }) {
  return (
    <div
      className={`cube-face cube-face--${position} grid grid-cols-3 grid-rows-3 gap-[6%] p-[6%] rounded-[18px] border border-border bg-card shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)]`}
    >
      {STICKERS.map((_, i) => (
        <span
          key={i}
          className={
            i === 4
              ? "rounded-[6px] bg-primary"
              : "rounded-[6px] bg-secondary border border-border/60"
          }
        />
      ))}
    </div>
  );
}

export function RubiksCube() {
  return (
    <div className="cube-scene">
      <div className="cube">
        {FACES.map((face) => (
          <CubeFace key={face} position={face} />
        ))}
      </div>

      <style jsx>{`
        .cube-scene {
          --size: clamp(160px, 20vw, 260px);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1400px;
        }
        .cube {
          position: relative;
          width: var(--size);
          height: var(--size);
          transform-style: preserve-3d;
          animation: cube-spin 24s linear infinite;
        }
        .cube:hover {
          animation-play-state: paused;
        }
        .cube-face {
          position: absolute;
          inset: 0;
        }
        .cube-face--front {
          transform: translateZ(calc(var(--size) / 2));
        }
        .cube-face--back {
          transform: rotateY(180deg) translateZ(calc(var(--size) / 2));
        }
        .cube-face--right {
          transform: rotateY(90deg) translateZ(calc(var(--size) / 2));
        }
        .cube-face--left {
          transform: rotateY(-90deg) translateZ(calc(var(--size) / 2));
        }
        .cube-face--top {
          transform: rotateX(90deg) translateZ(calc(var(--size) / 2));
        }
        .cube-face--bottom {
          transform: rotateX(-90deg) translateZ(calc(var(--size) / 2));
        }

        @keyframes cube-spin {
          from {
            transform: rotateX(-20deg) rotateY(0deg);
          }
          to {
            transform: rotateX(-20deg) rotateY(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cube {
            animation: none;
            transform: rotateX(-20deg) rotateY(-35deg);
          }
        }
      `}</style>
    </div>
  );
}
