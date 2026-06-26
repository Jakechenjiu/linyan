"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

/* ===== 线框几何体 ===== */
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

/* ===== 体积光球 ===== */
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

/* ===== SDF 元球 ===== */
// 片段着色器 — 每个像素计算到所有球心的有符号距离，smoothMin融合
const metaballVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const metaballFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform vec3 uCenters[5];
  uniform float uRadii[5];
  uniform vec3 uColors[5];
  uniform float uTime;

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  void main() {
    float d = 1e10;
    vec3 blendColor = vec3(0.0);
    float totalWeight = 0.0;

    for (int i = 0; i < 5; i++) {
      float dist = length(vPosition - uCenters[i]);
      float metaballDist = dist / uRadii[i];
      float influence = exp(-metaballDist * 3.0) * 0.7;
      blendColor += uColors[i] * influence;
      totalWeight += influence;
      d = smin(d, metaballDist, 0.25);
    }

    blendColor /= max(totalWeight, 0.001);

    // 边缘发光 + 中心透明 (提高不透明度)
    float alpha = smoothstep(1.3, 0.3, d) * 0.12;
    float edgeGlow = smoothstep(1.1, 0.9, d) * 0.06;

    gl_FragColor = vec4(blendColor, alpha + edgeGlow);
  }
`;

function MetaballOrbs() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const uniforms = useMemo(() => ({
    uCenters: { value: [
      new THREE.Vector3(-5, 2, -4),
      new THREE.Vector3(4, -2, -5),
      new THREE.Vector3(0, 4, -6),
      new THREE.Vector3(-2, -3, -3),
      new THREE.Vector3(5, 1, -4),
    ]},
    uRadii: { value: [2.5, 2.0, 1.8, 2.2, 1.5] },
    uColors: { value: [
      new THREE.Color("#00e5ff"),
      new THREE.Color("#7c3aed"),
      new THREE.Color("#f0e68c"),
      new THREE.Color("#00e5ff"),
      new THREE.Color("#7c3aed"),
    ]},
    uTime: { value: 0 },
  }), []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    // 元球缓慢漂移
    for (let i = 0; i < 5; i++) {
      const c = uniforms.uCenters.value[i];
      c.y += Math.sin(uniforms.uTime.value * 0.4 + i) * delta * 0.15;
      c.x += Math.cos(uniforms.uTime.value * 0.3 + i * 1.3) * delta * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -3]} scale={[size.width / 100, size.height / 100, 1]}>
      <planeGeometry args={[100, 100]} />
      <shaderMaterial
        vertexShader={metaballVertexShader}
        fragmentShader={metaballFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ===== 主场景 ===== */
function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += (mouseRef.current.x * 0.08 - groupRef.current.rotation.y) * 0.02;
      groupRef.current.rotation.x += (-mouseRef.current.y * 0.05 - groupRef.current.rotation.x) * 0.02;
    }
  });

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

      <Stars radius={18} depth={10} count={500} factor={4} saturation={0.15} fade speed={0.05} />

      <WireframeGeo position={[-5, 2, -8]} rotation={[0.5, 0, 0.3]} color="#00e5ff" size={2.5} speed={0.4} />
      <WireframeGeo position={[5, -2.5, -10]} rotation={[-0.3, 0.8, 0]} color="#7c3aed" size={1.8} speed={0.6} />
      <WireframeGeo position={[-2, -3, -7]} rotation={[0.7, 1.2, 0.1]} color="#f0e68c" size={1.4} speed={0.35} />
      <WireframeGeo position={[3, 1.5, -9]} rotation={[0.2, -0.5, 0.5]} color="#00e5ff" size={2.0} speed={0.5} />

      <VolumeOrb position={[-4.5, 1.8, -6]} color="#00e5ff" layers={4} />
      <VolumeOrb position={[4, -2, -7]} color="#7c3aed" layers={3} />
      <VolumeOrb position={[0.5, 3.5, -9]} color="#f0e68c" layers={3} />

      {/* SDF 元球 — 有机融合光斑替代 CSS 模糊球 */}
      <MetaballOrbs />
    </group>
  );
}

/* ===== 导出 ===== */
export default function WorkspaceAtmosphere() {
  return (
    <Canvas
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      camera={{ position: [0, 0, 5], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene />
      {/* Bloom 后处理 — 真实泛光替代 CSS fake glow */}
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.15}
          mipmapBlur
          intensity={0.6}
          radius={0.9}
        />
      </EffectComposer>
    </Canvas>
  );
}
