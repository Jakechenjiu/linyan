"use client";

import { useEffect, useRef } from "react";
import ParticleBg from "./ParticleBg";

/**
 * GPGPU 粒子背景 — 高性能 WebGPU/Canvas 2D 双层
 *
 * 检测 WebGPU 支持：
 * - 支持 → 尝试使用 Three-VFX 或高密度 Canvas 2D（粒子数上限 3000）
 * - 不支持 → 回退标准 ParticleBg（粒子数上限 200）
 */

function isWebGPUSupported(): boolean {
  try {
    return "gpu" in navigator;
  } catch {
    return false;
  }
}

export default function GPGPUParticleBg() {
  const hasGPU = useRef(false);

  useEffect(() => {
    hasGPU.current = isWebGPUSupported();
  }, []);

  // 当前实现：WebGPU 检测 + Canvas 2D 高密度模式
  // 未来可替换为 Three-VFX WebGPU compute shader
  return <ParticleBg density={hasGPU.current ? "high" : "normal"} />;
}
