"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";

function NebulaOrb({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <Float speed={0.4} rotationIntensity={0.1} floatIntensity={0.3}>
      <mesh position={position}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.025} depthWrite={false} />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <Stars
        radius={12}
        depth={6}
        count={400}
        factor={3}
        saturation={0.2}
        fade
        speed={0.08}
      />
      <NebulaOrb position={[-4, 1.5, -5]} color="#00e5ff" />
      <NebulaOrb position={[3.5, -2, -6]} color="#7c3aed" />
      <NebulaOrb position={[1, 3, -8]} color="#f0e68c" />
    </>
  );
}

export default function WorkspaceAtmosphere() {
  return (
    <Canvas
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
    >
      <Scene />
    </Canvas>
  );
}
