"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  PresentationControls,
  Environment,
  ContactShadows,
  Float,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

// Array to hold the offset positions for the 27 sub-cubes
const POSITIONS: [number, number, number][] = [];
const SPACING = 1.08; // Slightly wider gap for rounded cubes

for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      POSITIONS.push([x * SPACING, y * SPACING, z * SPACING]);
    }
  }
}

// Dark theme materials — deep, reflective, premium look
const DARK_MATERIALS = [
  // Glossy dark
  new THREE.MeshPhysicalMaterial({
    color: "#1a1a1a",
    metalness: 0.4,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1,
  }),
  // Matte charcoal
  new THREE.MeshStandardMaterial({
    color: "#2a2a2a",
    metalness: 0.3,
    roughness: 0.7,
  }),
  // Metallic gunmetal
  new THREE.MeshPhysicalMaterial({
    color: "#333333",
    metalness: 0.9,
    roughness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  }),
  // Deep obsidian
  new THREE.MeshPhysicalMaterial({
    color: "#111111",
    metalness: 0.6,
    roughness: 0.4,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  }),
];

// Light theme materials — clean white premium look
const LIGHT_MATERIALS = [
  // Glossy White
  new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    metalness: 0.1,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  }),
  // Matte Light Gray
  new THREE.MeshStandardMaterial({
    color: "#f0f0f0",
    metalness: 0.2,
    roughness: 0.8,
  }),
  // Metallic Silver
  new THREE.MeshStandardMaterial({
    color: "#e0e0e0",
    metalness: 0.8,
    roughness: 0.3,
  }),
  // Soft White
  new THREE.MeshStandardMaterial({
    color: "#fafafa",
    metalness: 1,
    roughness: 1,
  }),
];

function CubeCluster({ isDark }: { isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  // Pre-assign material indices so they don't change on re-render
  const materialIndices = useMemo(
    () => POSITIONS.map(() => Math.floor(Math.random() * 4)),
    [],
  );

  // Pick materials based on theme
  const materials = isDark ? DARK_MATERIALS : LIGHT_MATERIALS;

  // Smooth, organic rotation using sine curves instead of constant delta
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      // Smooth eased rotation — varies speed organically
      groupRef.current.rotation.y =
        t * 0.15 + Math.sin(t * 0.3) * 0.4;
      groupRef.current.rotation.x =
        Math.sin(t * 0.2) * 0.3 + Math.cos(t * 0.15) * 0.2;
      groupRef.current.rotation.z = Math.sin(t * 0.1) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {POSITIONS.map((pos, i) => (
        <RoundedBox
          key={i}
          args={[0.95, 0.95, 0.95]}
          radius={0.12}
          smoothness={4}
          position={pos}
          material={materials[materialIndices[i]]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();

    // Watch for class changes on <html>
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function RubiksCube() {
  const isDark = useIsDark();

  return (
    <div className="w-full h-full min-h-[400px] md:min-h-[500px]">
      <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
        {/* Lighting adjusted per theme */}
        <ambientLight intensity={isDark ? 0.3 : 0.7} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={isDark ? 2 : 1.5}
          castShadow
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={isDark ? 0.3 : 0.5}
        />
        {/* Subtle rim light for dark mode edge definition */}
        {isDark && (
          <pointLight
            position={[-5, 5, -5]}
            intensity={0.6}
            color="#4466ff"
          />
        )}
        <Environment preset={isDark ? "night" : "city"} />

        <PresentationControls
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
            <CubeCluster isDark={isDark} />
          </Float>
        </PresentationControls>

        {/* Soft shadow on the floor */}
        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={isDark ? 0.6 : 0.4}
          scale={10}
          blur={2.5}
          far={4}
          color={isDark ? "#000000" : "#666666"}
        />
      </Canvas>
    </div>
  );
}
