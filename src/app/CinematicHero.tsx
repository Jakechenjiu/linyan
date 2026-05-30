"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { ArrowRight } from "lucide-react";

export function CinematicHero({ hasSession }: { hasSession: boolean }) {
  const headline = "让AI成为";
  const headline2 = "你的创作引擎";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section className="relative z-10 flex flex-col items-center text-center px-6 pt-32 pb-12 max-w-5xl mx-auto">
      {/* Badge */}
      <div
        className="mb-10 transition-all duration-1000"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
        }}
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wider border border-white/[0.06] bg-white/[0.02] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse-slow" />
          AI 创作平台 · 灵砚 LingYan
        </span>
      </div>

      {/* Logo mark */}
      <div
        className="mb-10 animate-float"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.2s" }}
      >
        <Logo size="lg" />
      </div>

      {/* Headline — cinematic staggered */}
      <h1 className="font-mono text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
        <span className="block">
          {headline.split("").map((char, i) => (
            <span
              key={i}
              className="char-reveal text-[var(--text-primary)]"
              style={{ animationDelay: `${0.4 + i * 0.05}s` }}
            >
              {char === " " ? " " : char}
            </span>
          ))}
        </span>
        <span className="block mt-2">
          {headline2.split("").map((char, i) => (
            <span
              key={i}
              className="char-reveal text-gradient-cyan glow-text-strong"
              style={{ animationDelay: `${0.7 + i * 0.05}s` }}
            >
              {char === " " ? " " : char}
            </span>
          ))}
        </span>
      </h1>

      <p
        className="text-base md:text-lg text-muted-foreground max-w-xl mb-12 leading-relaxed"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s var(--ease-cinematic) 1.4s",
        }}
      >
        灵思笔记 · 星图写作 · 光子发布 · 万象推演<br />
        知识管理、长篇创作、内容分发、AI推演，一个平台全覆盖
      </p>

      {/* CTAs */}
      <div
        className="flex flex-col sm:flex-row items-center gap-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.7s var(--ease-cinematic) 1.6s",
        }}
      >
        <Link
          href={hasSession ? "/workspace" : "/register"}
          className="px-8 py-4 rounded-xl text-base font-bold bg-[var(--cyan)] hover:shadow-[0_0_32px_rgba(0,229,255,0.4)] transition-all duration-500 flex items-center gap-2 btn-shimmer hover-lift ripple"
          style={{ color: "#0a0e17" }}
        >
          {hasSession ? "进入工作台" : "开始创作"} <ArrowRight size={18} />
        </Link>
        <Link
          href="/explore"
          className="px-8 py-4 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 liquid-glass"
        >
          探索内容
        </Link>
      </div>

      {/* Scroll hint — animated line instead of arrow */}
      <div
        className="mt-20 flex flex-col items-center gap-2"
        style={{
          opacity: visible ? 0.5 : 0,
          transition: "opacity 0.8s ease 2s",
        }}
      >
        <div
          className="w-px h-10 bg-gradient-to-b from-[var(--cyan)]/20 to-transparent"
          style={{ animation: "scroll-line 2s ease-in-out infinite alternate" }}
        />
        <span className="text-[10px] text-muted-foreground/30 tracking-widest uppercase">
          向下滚动
        </span>
      </div>
    </section>
  );
}
