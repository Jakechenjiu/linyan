"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const posRef = useRef({ x: -1000, y: -1000 });
  const frameRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      // Lerp toward mouse for smooth following
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const px = posRef.current.x;
      const py = posRef.current.y;

      const ease = mx < 0 ? 0.08 : 0.06;
      posRef.current = {
        x: px + (mx - px) * ease,
        y: py + (my - py) * ease,
      };

      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(circle 600px at ${posRef.current.x}px ${posRef.current.y}px, rgba(0,229,255,0.045), rgba(124,58,237,0.02) 40%, transparent 65%)`;
        glowRef.current.style.opacity = mx < 0 ? "0" : "1";
      }

      frameRef.current = requestAnimationFrame(animate);
    };

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
      style={{ transition: "opacity 0.6s ease" }}
    />
  );
}
