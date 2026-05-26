"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.setProperty("--cursor-x", `${e.clientX}px`);
        ref.current.style.setProperty("--cursor-y", `${e.clientY}px`);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-10 pointer-events-none"
      style={{
        background: "radial-gradient(400px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(0,229,255,0.04), transparent 60%)",
      }}
    />
  );
}
