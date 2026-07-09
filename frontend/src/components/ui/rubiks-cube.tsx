"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  PresentationControls,
  Environment,
  ContactShadows,
  Float,
} from "@react-three/drei";
import * as THREE from "three";

// Array to hold the offset positions for the 27 sub-cubes
const POSITIONS: [number, number, number][] = [];
const SPACING = 1.05; // Gap between cubes

for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      POSITIONS.push([x * SPACING, y * SPACING, z * SPACING]);
    }
  }
}

// Generate an array of materials to mimic the varied texture look in the reference image
// We use a light monochrome palette to fit the "white color" requirement
const MATERIALS = [
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
  // Frosted Glass style
  new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    transmission: 0.9,
    opacity: 1,
    metalness: 0,
    roughness: 0.2,
    ior: 1.5,
    thickness: 0.5,
  }),
];

// Helper to pick a random material from the palette
const getRandomMaterial = () =>
  MATERIALS[Math.floor(Math.random() * MATERIALS.length)];

function CubeCluster() {
  const groupRef = useRef<THREE.Group>(null);

  // Pre-assign materials so they don't change on re-render
  const cubeMaterials = useMemo(
    () => POSITIONS.map(() => getRandomMaterial()),
    [],
  );

  // Gentle auto-rotation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {POSITIONS.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          material={cubeMaterials[i]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          {/* Subtle edge highlight */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
            <lineBasicMaterial color="#d0d0d0" linewidth={1} />
          </lineSegments>
        </mesh>
      ))}
    </group>
  );
}

export function RubiksCube() {
  return (
    <div className="w-full h-full min-h-[400px] md:min-h-[500px]">
      <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
        {/* Soft lighting setup for a clean white look */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <Environment preset="city" />

        {/* Presentation controls allow the user to drag to rotate the whole assembly */}
        <PresentationControls
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
            <CubeCluster />
          </Float>
        </PresentationControls>

        {/* Soft shadow on the floor */}
        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
        />
      </Canvas>
    </div>
  );
}
