"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";

interface SpotlightCardProps {
  href: string;
  children: ReactNode;
  color?: string;
  className?: string;
}

export default function SpotlightCard({ href, children, color = "var(--cyan)", className = "" }: SpotlightCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPos, setGlowPos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Spotlight position
    setGlowPos({ x: x / rect.width, y: y / rect.height });

    // Magnetic tilt (subtle 3D effect)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateY(((x - centerX) / centerX) * 3);
    setRotateX(((centerY - y) / centerY) * 3);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlowPos({ x: 0.5, y: 0.5 });
    setIsHovered(false);
  };

  return (
    <Link
      ref={cardRef}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`gradient-border-card group block relative overflow-hidden transition-all duration-500 ${className}`}
      style={{
        transform: isHovered
          ? `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)",
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Spotlight glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none z-10"
        style={{
          background: `radial-gradient(circle 320px at ${glowPos.x * 100}% ${glowPos.y * 100}%, ${color}14, transparent 60%)`,
        }}
      />
      <div className="relative z-20 p-6">{children}</div>
    </Link>
  );
}
