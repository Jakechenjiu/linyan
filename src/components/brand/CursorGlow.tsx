"use client";

import { useEffect, useRef } from "react";

/**
 * Hooke's Law 分析弹簧求解器
 * F = -k*x - d*v  →  闭合解：x(t) = e^(-ζωt) * (A*cos(ωd*t) + B*sin(ωd*t))
 *
 * 离散化实现：每帧更新速度+位置，delta time 钳制防丢帧跳变
 */
function springStep(
  state: { pos: number; vel: number },
  target: number,
  stiffness: number,
  damping: number,
  mass: number,
  dt: number
) {
  const dtClamped = Math.min(dt, 0.05); // 钳制防跳变
  const fSpring = -stiffness * (state.pos - target);
  const fDamping = -damping * state.vel;
  const accel = (fSpring + fDamping) / mass;
  state.vel += accel * dtClamped;
  state.pos += state.vel * dtClamped;
}

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: -1000, y: -1000 });
  const springX = useRef({ pos: -1000, vel: 0 });
  const springY = useRef({ pos: -1000, vel: 0 });
  const lastTime = useRef(performance.now());
  const frameRef = useRef(0);

  useEffect(() => {
    // 弹簧参数 — 轻微过冲，自然手感
    const STIFFNESS = 160;
    const DAMPING = 10;
    const MASS = 1;

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      targetRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    const animate = (now: number) => {
      const dt = (now - lastTime.current) / 1000;
      lastTime.current = now;

      const tx = targetRef.current.x;
      const ty = targetRef.current.y;

      if (tx < 0) {
        // 鼠标离开 — 缓慢回位
        springStep(springX.current, -1000, STIFFNESS * 0.3, DAMPING * 2, MASS, dt);
        springStep(springY.current, -1000, STIFFNESS * 0.3, DAMPING * 2, MASS, dt);
      } else {
        springStep(springX.current, tx, STIFFNESS, DAMPING, MASS, dt);
        springStep(springY.current, ty, STIFFNESS, DAMPING, MASS, dt);
      }

      if (glowRef.current) {
        const x = springX.current.pos;
        const y = springY.current.pos;
        glowRef.current.style.background =
          `radial-gradient(circle 600px at ${x}px ${y}px, rgba(0,229,255,0.045), rgba(124,58,237,0.02) 40%, transparent 65%)`;
        glowRef.current.style.opacity = tx < 0 ? "0" : "1";
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    lastTime.current = performance.now();
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="cursor-glow-layer"
      aria-hidden="true"
      style={{ transition: "opacity 0.4s ease" }}
    />
  );
}
