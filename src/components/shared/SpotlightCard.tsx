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

    setGlowPos({ x: x / rect.width, y: y / rect.height });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateY(((x - centerX) / centerX) * 5);
    setRotateX(((centerY - y) / centerY) * 5);
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
          ? `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.015)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)",
        boxShadow: isHovered
          ? `0 8px 40px rgba(0,0,0,0.5), 0 0 30px ${color}18, 0 0 60px ${color}08`
          : "0 2px 8px rgba(0,0,0,0.3)",
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
        style={{
          background: `radial-gradient(circle 400px at ${glowPos.x * 100}% ${glowPos.y * 100}%, ${color}18, transparent 55%)`,
        }}
      />
      <div className="relative z-20 p-6">{children}</div>
    </Link>
  );
}
