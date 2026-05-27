"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// Check if user prefers reduced motion or has low performance
function usePerformanceMode() {
  const [lowPerf, setLowPerf] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Check if mobile (low power)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    // Check hardware concurrency (CPU cores)
    const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

    setLowPerf(prefersReduced || isMobile || !!lowCores);
  }, []);

  return lowPerf;
}

// Simple floating particles - minimal version
function FloatingParticles({ count = 300 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.01;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00e5ff"
        size={0.015}
        sizeAttenuation
        depthWrite={false}
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// Simple floating orb - just one, subtle
function FloatingOrb() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.5;
      ref.current.rotation.x = state.clock.elapsedTime * 0.1;
      ref.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, -5]}>
      <icosahedronGeometry args={[0.8, 1]} />
      <meshStandardMaterial
        color="#00e5ff"
        transparent
        opacity={0.06}
        wireframe
      />
    </mesh>
  );
}

export default function ImmersiveScene() {
  const lowPerf = usePerformanceMode();

  // Don't render 3D on low performance devices
  if (lowPerf) {
    return (
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,229,255,0.03) 0%, transparent 60%)",
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: "transparent" }}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: true,
        }}
        dpr={1}
        frameloop="demand"
      >
        <ambientLight intensity={0.1} />

        <FloatingParticles count={300} />
        <FloatingOrb />
      </Canvas>
    </div>
  );
}
