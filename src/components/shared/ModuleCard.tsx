"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";

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

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
  };

  return (
    <Link
      ref={cardRef}
      href={href}
      onMouseMove={handleMouseMove}
      className="space-card group rounded-2xl p-6 block relative overflow-hidden cursor-pointer spotlight-card"
      style={{ borderColor: `${color}20`, ["--spot-color" as string]: color }}
    >
      {/* Mouse-following spotlight */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle 280px at var(--mx, 50%) var(--my, 50%), ${color}12, transparent 70%)`,
        }}
      />
      <div className="relative z-10">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
          style={{
            background: `${color}15`,
            color,
            boxShadow: `0 0 20px ${color}00`,
          }}
        >
          <div className="group-hover:animate-pulse-slow">{icon}</div>
        </div>
        <h3 className="font-mono text-lg font-bold tracking-wide mb-1 group-hover:translate-x-1 transition-transform duration-300" style={{ color }}>
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2 group-hover:text-[var(--foreground)] transition-colors duration-300">{subtitle}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
        <div className="flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span
              key={f}
              className="text-[10px] px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform duration-300"
              style={{ background: `${color}10`, color }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
