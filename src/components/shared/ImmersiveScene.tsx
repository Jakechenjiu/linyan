"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

// Nebula cloud particles
function NebulaParticles({ count = 3000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0 });

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5 + Math.random() * 10;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      // Cyan to Nebula gradient
      cols[i * 3] = 0 + t * 0.48;     // R
      cols[i * 3 + 1] = 0.9 - t * 0.67; // G
      cols[i * 3 + 2] = 1 - t * 0.07;   // B
    }
    return cols;
  }, [count]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    const geo = ref.current.geometry;
    const posArray = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArray[i3] += velocities[i3] + Math.sin(time * 0.3 + i) * 0.002;
      posArray[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.2 + i) * 0.002;
      posArray[i3 + 2] += velocities[i3 + 2];

      // Mouse influence
      posArray[i3] += mouse.current.x * 0.01;
      posArray[i3 + 1] += mouse.current.y * 0.01;
    }

    geo.attributes.position.needsUpdate = true;
    ref.current.rotation.y = time * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.015}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// Floating geometric shapes
function FloatingGeometry() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.05;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <group ref={group}>
      {/* Icosahedron */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[-3, 1, -2]}>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshStandardMaterial
            color="#00e5ff"
            transparent
            opacity={0.1}
            wireframe
          />
        </mesh>
      </Float>

      {/* Torus */}
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.3}>
        <mesh position={[3, -1, -3]}>
          <torusGeometry args={[0.4, 0.15, 16, 32]} />
          <meshStandardMaterial
            color="#7c3aed"
            transparent
            opacity={0.08}
            wireframe
          />
        </mesh>
      </Float>

      {/* Octahedron */}
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.4}>
        <mesh position={[0, 2, -4]}>
          <octahedronGeometry args={[0.3]} />
          <meshStandardMaterial
            color="#f0e68c"
            transparent
            opacity={0.12}
            wireframe
          />
        </mesh>
      </Float>

      {/* Dodecahedron */}
      <Float speed={1} rotationIntensity={0.6} floatIntensity={0.6}>
        <mesh position={[-2, -2, -5]}>
          <dodecahedronGeometry args={[0.35]} />
          <meshStandardMaterial
            color="#00e5ff"
            transparent
            opacity={0.06}
            wireframe
          />
        </mesh>
      </Float>
    </group>
  );
}

// Connection lines between points
function ConnectionLines() {
  const ref = useRef<THREE.LineSegments>(null);

  const { positions, colors } = useMemo(() => {
    const count = 50;
    const pos = new Float32Array(count * 6); // 2 points per line
    const cols = new Float32Array(count * 6);

    for (let i = 0; i < count; i++) {
      const i6 = i * 6;
      // Start point
      pos[i6] = (Math.random() - 0.5) * 10;
      pos[i6 + 1] = (Math.random() - 0.5) * 10;
      pos[i6 + 2] = (Math.random() - 0.5) * 10;
      // End point
      pos[i6 + 3] = pos[i6] + (Math.random() - 0.5) * 3;
      pos[i6 + 4] = pos[i6 + 1] + (Math.random() - 0.5) * 3;
      pos[i6 + 5] = pos[i6 + 2] + (Math.random() - 0.5) * 3;

      // Color (cyan, low opacity)
      cols[i6] = 0;
      cols[i6 + 1] = 0.9;
      cols[i6 + 2] = 1;
      cols[i6 + 3] = 0;
      cols[i6 + 4] = 0.9;
      cols[i6 + 5] = 1;
    }

    return { positions: pos, colors: cols };
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// Camera controller with mouse follow
function CameraController() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    camera.position.x += (mouse.current.x * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouse.current.y * 0.3 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function ImmersiveScene() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: "transparent" }}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.15} />
        <pointLight position={[10, 10, 10]} intensity={0.2} color="#00e5ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.15} color="#7c3aed" />
        <pointLight position={[0, 5, 5]} intensity={0.1} color="#f0e68c" />

        <CameraController />
        <NebulaParticles count={2000} />
        <FloatingGeometry />
        <ConnectionLines />
      </Canvas>
    </div>
  );
}
