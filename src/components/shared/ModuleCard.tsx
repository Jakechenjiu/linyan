import Link from "next/link";
import type { ReactNode } from "react";

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
  return (
    <Link
      href={href}
      className="space-card group rounded-2xl p-6 block relative overflow-hidden"
      style={{ borderColor: `${color}20` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}10, transparent 60%)` }}
      />
      <div className="relative z-10">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
          style={{ background: `${color}15`, color }}
        >
          {icon}
        </div>
        <h3 className="font-mono text-lg font-bold tracking-wide mb-1" style={{ color }}>
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
        <div className="flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${color}10`, color }}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
