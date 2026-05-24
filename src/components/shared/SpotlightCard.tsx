"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";

interface SpotlightCardProps {
  href: string;
  children: ReactNode;
  color?: string;
  className?: string;
}

export default function SpotlightCard({ href, children, color = "var(--cyan)", className = "" }: SpotlightCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!glowRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glowRef.current.style.background = `radial-gradient(circle 280px at ${x}px ${y}px, ${color}12, transparent 70%)`;
    glowRef.current.style.opacity = "1";
  };

  const handleMouseLeave = () => {
    if (!glowRef.current) return;
    glowRef.current.style.opacity = "0";
  };

  return (
    <Link
      ref={cardRef}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`space-card group rounded-2xl p-6 relative overflow-hidden hover-lift spotlight-card ${className}`}
      style={{ borderColor: `${color}20` }}
    >
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
      />
      {children}
    </Link>
  );
}
