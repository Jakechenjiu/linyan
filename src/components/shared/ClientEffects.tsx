"use client";

import { useEffect, useState } from "react";

export default function ClientEffects() {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setMounted(true);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (prefersReduced || isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Mouse-following ambient glow */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(0,229,255,0.04), transparent 60%)`,
          transition: "background 0.3s ease-out",
        }}
      />
      {/* Static ambient glow */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 20% 20%, rgba(0,229,255,0.02) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 80% 80%, rgba(124,58,237,0.02) 0%, transparent 60%)
          `,
        }}
      />
    </>
  );
}
