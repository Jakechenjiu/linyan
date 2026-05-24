"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

function WireframeGeo({ position, rotation, color, size, speed }: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  size: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * speed * 0.3;
      ref.current.rotation.y += delta * speed * 0.5;
    }
  });
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <icosahedronGeometry args={[size, 1]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.04} depthWrite={false} />
    </mesh>
  );
}

function VolumeOrb({ position, color, layers = 3 }: {
  position: [number, number, number];
  color: string;
  layers?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y += Math.sin(clock.elapsedTime * 0.3) * 0.001;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: layers }, (_, i) => {
        const scale = 0.6 + i * 0.45;
        const alpha = 0.025 - i * 0.006;
        return (
          <mesh key={i} scale={[scale, scale, scale]}>
            <sphereGeometry args={[2, 32, 32]} />
            <meshBasicMaterial color={color} transparent opacity={Math.max(0.006, alpha)} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Track mouse for subtle parallax
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += (mouseRef.current.x * 0.08 - groupRef.current.rotation.y) * 0.02;
      groupRef.current.rotation.x += (-mouseRef.current.y * 0.05 - groupRef.current.rotation.x) * 0.02;
    }
  });

  // Listen to mouse on window (only once)
  useMemo(() => {
    if (typeof window === "undefined") return;
    const handler = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.08} />

      <Stars
        radius={18}
        depth={10}
        count={500}
        factor={4}
        saturation={0.15}
        fade
        speed={0.05}
      />

      {/* Wireframe geometries — sci-fi UI feel */}
      <WireframeGeo position={[-5, 2, -8]} rotation={[0.5, 0, 0.3]} color="#00e5ff" size={2.5} speed={0.4} />
      <WireframeGeo position={[5, -2.5, -10]} rotation={[-0.3, 0.8, 0]} color="#7c3aed" size={1.8} speed={0.6} />
      <WireframeGeo position={[-2, -3, -7]} rotation={[0.7, 1.2, 0.1]} color="#f0e68c" size={1.4} speed={0.35} />
      <WireframeGeo position={[3, 1.5, -9]} rotation={[0.2, -0.5, 0.5]} color="#00e5ff" size={2.0} speed={0.5} />

      {/* Volume orbs — layered transparent spheres for faux volumetric light */}
      <VolumeOrb position={[-4.5, 1.8, -6]} color="#00e5ff" layers={4} />
      <VolumeOrb position={[4, -2, -7]} color="#7c3aed" layers={3} />
      <VolumeOrb position={[0.5, 3.5, -9]} color="#f0e68c" layers={3} />
    </group>
  );
}

export default function WorkspaceAtmosphere() {
  return (
    <Canvas
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      camera={{ position: [0, 0, 5], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene />
    </Canvas>
  );
}
