"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { ArrowRight, Sparkles } from "lucide-react";

export function CinematicHero({ hasSession }: { hasSession: boolean }) {
  const [visible, setVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-16 max-w-5xl mx-auto"
    >
      {/* Ambient glow following mouse */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}% ${mousePos.y}%, rgba(0,229,255,0.06), transparent 60%)`,
        }}
      />

      {/* Badge */}
      <div
        className="mb-8 transition-all duration-1000"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
        }}
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wider border border-white/[0.06] bg-white/[0.02] text-muted-foreground">
          <Sparkles size={12} className="text-[var(--cyan)]" />
          AI 驱动的全栈创作平台
        </span>
      </div>

      {/* Logo */}
      <div
        className="mb-8 animate-float"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.2s" }}
      >
        <Logo size="lg" />
      </div>

      {/* Headline */}
      <h1 className="font-mono text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
        <span className="block text-gradient-cyan glow-text-strong">
          让AI成为
        </span>
        <span className="block mt-2 text-[var(--text-primary)]">
          你的创作引擎
        </span>
      </h1>

      {/* Subtitle */}
      <p
        className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s var(--ease-cinematic) 1.0s",
        }}
      >
        一个人，一个团队的创作力。<br />
        写小说、做视频、管知识、推演未来。
      </p>

      {/* CTAs */}
      <div
        className="flex items-center gap-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.7s var(--ease-cinematic) 1.2s",
        }}
      >
        <Link
          href={hasSession ? "/workspace" : "/register"}
          className="px-8 py-4 rounded-xl text-base font-bold bg-[var(--cyan)] hover:shadow-[0_0_32px_rgba(0,229,255,0.4)] transition-all duration-500 flex items-center gap-2 btn-shimmer ripple"
          style={{ color: "#0a0e17" }}
        >
          {hasSession ? "进入工作台" : "免费开始"} <ArrowRight size={18} />
        </Link>
        <Link
          href="/explore"
          className="px-8 py-4 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500"
        >
          看看别人怎么用
        </Link>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-3 gap-8 mt-16"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease 1.5s",
        }}
      >
        {[
          { value: "4", label: "创作模块" },
          { value: "5", label: "AI 模式" },
          { value: "6", label: "支持平台" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="font-mono text-2xl font-bold text-[var(--cyan)]">{stat.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
