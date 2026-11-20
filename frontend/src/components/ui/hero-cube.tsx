"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

// three.js, react-three-fiber and drei come to ~270 KB of compressed
// JavaScript. Loaded statically they delayed the landing page's first
// interaction, and because every guest page links to "/", Next.js prefetched
// them on every guest page too. As a dynamic import they are fetched only
// when the cube is about to be seen.
const RubiksCube = dynamic(
  () => import("./rubiks-cube").then((m) => m.RubiksCube),
  { ssr: false },
);

/**
 * Whether WebGL runs on a real GPU. A browser without GPU acceleration (a
 * blocklisted driver, a VM, a locked-down machine) falls back to a software
 * renderer that draws this scene at about 2 fps after a multi-second setup,
 * blocking the main thread throughout: much worse than no cube. In that case,
 * and without WebGL, the 3D code is not even downloaded.
 */
function hasHardwareWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}

/**
 * The cube is decoration. If WebGL fails anyway, react-three-fiber throws
 * while rendering, and without a boundary that error unmounted the whole
 * landing page.
 */
class DecorationBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The landing-page cube. Reserves its space up front (no layout shift),
 * loads the 3D code when the slot comes within 200px of the viewport (on
 * phones it sits below the fold), and pauses rendering whenever it is
 * scrolled away.
 */
export function HeroCube() {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let capable: boolean | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (!entry.isIntersecting) return;
        // Probed once, and only when the cube is about to be seen.
        capable ??= hasHardwareWebGL();
        if (capable) setLoaded(true);
        else observer.disconnect();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full min-h-[400px] md:min-h-[500px]">
      {loaded && (
        <DecorationBoundary>
          <RubiksCube active={inView} />
        </DecorationBoundary>
      )}
    </div>
  );
}
