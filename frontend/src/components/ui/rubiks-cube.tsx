"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Float,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

/* ── Constants ── */
const SPACING = 1.08;
const CUBE_SIZE = 0.95;
const CORNER_RADIUS = 0.12;
const MOVE_DURATION = 0.55; // seconds per 90° layer turn
const PAUSE_BETWEEN = 1.4; // seconds between scramble moves

/* ── Easing ── */
function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

/* ── Materials ── */
const DARK_MATERIALS = [
  new THREE.MeshPhysicalMaterial({
    color: "#1a1a1a",
    metalness: 0.4,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1,
  }),
  new THREE.MeshStandardMaterial({
    color: "#2a2a2a",
    metalness: 0.3,
    roughness: 0.7,
  }),
  new THREE.MeshPhysicalMaterial({
    color: "#333333",
    metalness: 0.9,
    roughness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  }),
  new THREE.MeshPhysicalMaterial({
    color: "#111111",
    metalness: 0.6,
    roughness: 0.4,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  }),
];

const LIGHT_MATERIALS = [
  // Glossy porcelain white
  new THREE.MeshPhysicalMaterial({
    color: "#f8f8f8",
    metalness: 0.05,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
  }),
  // Pearl off-white — subtle warmth
  new THREE.MeshPhysicalMaterial({
    color: "#f0ede8",
    metalness: 0.15,
    roughness: 0.25,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    reflectivity: 0.7,
  }),
  // Polished chrome silver
  new THREE.MeshPhysicalMaterial({
    color: "#dcdcdc",
    metalness: 0.85,
    roughness: 0.12,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    reflectivity: 1,
  }),
  // Satin ivory
  new THREE.MeshPhysicalMaterial({
    color: "#eeeae4",
    metalness: 0.1,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    reflectivity: 0.5,
  }),
];

/* ── Types ── */
type Axis = "x" | "y" | "z";

interface CubeData {
  position: THREE.Vector3; // grid coords (-1 | 0 | 1)
  quaternion: THREE.Quaternion; // accumulated rotation from past moves
  materialIndex: number;
}

interface ActiveMove {
  axis: Axis;
  layerValue: number; // -1, 0, or 1
  direction: number; // 1 or -1
  affected: number[]; // indices of cubes in this layer
  elapsed: number;
}

/* ── Scramble cube cluster ── */
function CubeCluster({ isDark }: { isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pieceRefs = useRef<(THREE.Group | null)[]>([]);

  // Cube state — survives re-renders via ref
  const cubes = useRef<CubeData[]>([]);
  const moveRef = useRef<ActiveMove | null>(null);
  const pauseRef = useRef(2.0); // initial delay before first scramble

  // Stable material indices
  const materialIndices = useMemo(() => {
    const indices: number[] = [];
    const data: CubeData[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const idx = (Math.abs(x * 7 + y * 13 + z * 17) % 4);
          indices.push(idx);
          data.push({
            position: new THREE.Vector3(x, y, z),
            quaternion: new THREE.Quaternion(),
            materialIndex: idx,
          });
        }
      }
    }
    cubes.current = data;
    return indices;
  }, []);

  const materials = isDark ? DARK_MATERIALS : LIGHT_MATERIALS;

  /* Start a random scramble move */
  const startMove = () => {
    const axes: Axis[] = ["x", "y", "z"];
    const axis = axes[Math.floor(Math.random() * 3)];
    const layers = [-1, 0, 1];
    const layerValue = layers[Math.floor(Math.random() * 3)];
    const direction = Math.random() > 0.5 ? 1 : -1;

    const affected: number[] = [];
    cubes.current.forEach((cube, i) => {
      if (Math.round(cube.position[axis]) === layerValue) {
        affected.push(i);
      }
    });

    moveRef.current = { axis, layerValue, direction, affected, elapsed: 0 };
  };

  /* Temp vectors to avoid per-frame allocations */
  const _axisVec = useMemo(() => new THREE.Vector3(), []);
  const _animQuat = useMemo(() => new THREE.Quaternion(), []);
  const _pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    /* ── Overall gentle drift rotation ── */
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.y = t * 0.15 + Math.sin(t * 0.3) * 0.4;
      groupRef.current.rotation.x =
        Math.sin(t * 0.2) * 0.3 + Math.cos(t * 0.15) * 0.2;
      groupRef.current.rotation.z = Math.sin(t * 0.1) * 0.08;
    }

    const move = moveRef.current;

    /* ── Idle: countdown to next move ── */
    if (!move) {
      pauseRef.current -= delta;
      if (pauseRef.current <= 0) {
        startMove();
        pauseRef.current = PAUSE_BETWEEN;
      }
      // Sync cubes to their resting state
      cubes.current.forEach((cube, i) => {
        const g = pieceRefs.current[i];
        if (!g) return;
        g.position.copy(cube.position).multiplyScalar(SPACING);
        g.quaternion.copy(cube.quaternion);
      });
      return;
    }

    /* ── Animating a layer ── */
    move.elapsed += delta;
    const rawProgress = Math.min(move.elapsed / MOVE_DURATION, 1);
    const eased = easeInOutQuart(rawProgress);
    const currentAngle = (Math.PI / 2) * move.direction * eased;

    _axisVec.set(
      move.axis === "x" ? 1 : 0,
      move.axis === "y" ? 1 : 0,
      move.axis === "z" ? 1 : 0,
    );
    _animQuat.setFromAxisAngle(_axisVec, currentAngle);

    cubes.current.forEach((cube, i) => {
      const g = pieceRefs.current[i];
      if (!g) return;

      if (move.affected.includes(i)) {
        // Rotate position around the layer axis
        _pos
          .copy(cube.position)
          .applyAxisAngle(_axisVec, currentAngle)
          .multiplyScalar(SPACING);
        g.position.copy(_pos);
        // Combine move rotation with cube's accumulated rotation
        g.quaternion.copy(_animQuat).multiply(cube.quaternion);
      } else {
        // Not in this layer — just rest
        g.position.copy(cube.position).multiplyScalar(SPACING);
        g.quaternion.copy(cube.quaternion);
      }
    });

    /* ── Move complete → bake rotation into cube state ── */
    if (rawProgress >= 1) {
      const finalAngle = (Math.PI / 2) * move.direction;
      const finalQuat = new THREE.Quaternion().setFromAxisAngle(
        _axisVec,
        finalAngle,
      );

      for (const i of move.affected) {
        const cube = cubes.current[i];
        cube.position.applyAxisAngle(_axisVec, finalAngle);
        // Snap to integer grid to prevent floating-point drift
        cube.position.x = Math.round(cube.position.x);
        cube.position.y = Math.round(cube.position.y);
        cube.position.z = Math.round(cube.position.z);
        cube.quaternion.premultiply(finalQuat);
      }

      moveRef.current = null;
    }
  });

  return (
    <group ref={groupRef}>
      {materialIndices.map((matIdx, i) => (
        <group
          key={i}
          ref={(el: THREE.Group | null) => {
            pieceRefs.current[i] = el;
          }}
        >
          <RoundedBox
            args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]}
            radius={CORNER_RADIUS}
            smoothness={4}
            material={materials[matIdx]}
            castShadow
            receiveShadow
          />
        </group>
      ))}
    </group>
  );
}

/* ── Dark mode detection hook ── */
function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

/* ── Exported component ── */
export function RubiksCube() {
  const isDark = useIsDark();

  return (
    <div className="w-full h-full min-h-[400px] md:min-h-[500px]">
      <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
        <ambientLight intensity={isDark ? 0.3 : 0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={isDark ? 2 : 1.8}
          castShadow
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={isDark ? 0.3 : 0.4}
        />
        {/* Accent rim light — blue for dark, warm for light */}
        <pointLight
          position={isDark ? [-5, 5, -5] : [5, 3, -6]}
          intensity={isDark ? 0.6 : 0.5}
          color={isDark ? "#4466ff" : "#c8a87c"}
        />
        <Environment preset={isDark ? "night" : "studio"} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
        />

        <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
          <CubeCluster isDark={isDark} />
        </Float>

        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={isDark ? 0.6 : 0.5}
          scale={10}
          blur={2.5}
          far={4}
          color={isDark ? "#000000" : "#444444"}
        />
      </Canvas>
    </div>
  );
}
