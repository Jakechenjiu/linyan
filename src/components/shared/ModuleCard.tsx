"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";

interface ModuleCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  desc: string;
  color: string;
  features: string[];
}

export default function ModuleCard({ href, icon, title, subtitle, desc, color, features }: ModuleCardProps) {
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
      className="gradient-border-card group block relative overflow-hidden transition-all duration-500"
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
          background: `radial-gradient(circle 340px at ${glowPos.x * 100}% ${glowPos.y * 100}%, ${color}15, transparent 60%)`,
        }}
      />

      <div className="relative z-20 p-6">
        {/* Icon container */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
          style={{
            background: `${color}12`,
            color,
            boxShadow: isHovered ? `0 0 24px ${color}20` : "none",
          }}
        >
          <div className="group-hover:animate-pulse-slow">{icon}</div>
        </div>

        <h3
          className="font-mono text-lg font-bold tracking-wide mb-1 transition-all duration-300 group-hover:translate-x-1"
          style={{ color }}
        >
          {title}
        </h3>

        <p className="text-xs text-muted-foreground mb-2 transition-colors duration-300 group-hover:text-foreground/70">
          {subtitle}
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {desc}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span
              key={f}
              className="text-[10px] px-2 py-0.5 rounded-full transition-all duration-300 group-hover:scale-105"
              style={{
                background: `${color}0e`,
                color,
                border: `1px solid ${color}15`,
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
