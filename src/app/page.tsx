"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ParticleBg from "@/components/brand/ParticleBg";
import CursorGlow from "@/components/brand/CursorGlow";
import ModuleCard from "@/components/shared/ModuleCard";
import { Logo } from "@/components/brand";
import { Star, Zap, Network, Brain, ArrowRight } from "lucide-react";

function CinematicHero({ hasSession }: { hasSession: boolean }) {
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
        className="flex items-center gap-4"
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

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      <ParticleBg />
      <CursorGlow />

      {/* —— Nav —— */}
      <header className="relative z-10 liquid-glass border-b border-white/[0.04] rounded-none mx-0">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto w-full">
          <Logo size="md" />
          <div className="flex items-center gap-5">
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              探索
            </Link>
            {session ? (
              <Link
                href="/workspace"
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all duration-300 btn-shimmer ripple"
                style={{ color: "#0a0e17" }}
              >
                进入工作台
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all duration-300 btn-shimmer ripple"
                  style={{ color: "#0a0e17" }}
                >
                  免费注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* —— Hero —— */}
      <CinematicHero hasSession={!!session} />

      {/* —— Module Cards —— */}
      <section className="relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto px-6 pb-24">
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <ModuleCard
            href={session ? "/workspace/star" : "/register"}
            icon={<Star size={24} />}
            title="星图写作"
            subtitle="Star Writing"
            desc="长篇小说的智能创作引擎。章节管理、AI续写、写作分析，构建宏大叙事的完整星系。"
            color="var(--cyan)"
            features={["长篇创作", "AI续写", "章节管理", "写作统计"]}
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <ModuleCard
            href={session ? "/workspace/photon" : "/register"}
            icon={<Zap size={24} />}
            title="光子发布"
            subtitle="Photon Publishing"
            desc="自媒体爆款流水线。模板驱动 + 多平台一键生成，将创意以光速分发到全平台。"
            color="var(--nebula)"
            features={["多平台", "模板生成", "批量产出", "内容日历"]}
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <ModuleCard
            href={session ? "/workspace/notes" : "/register"}
            icon={<Brain size={24} />}
            title="灵思笔记"
            subtitle="LingSi Notes"
            desc="Obsidian 风格知识中枢。双向链接 [[语法]]、标签系统、知识图谱可视化。"
            color="var(--cyan)"
            features={["双向链接", "知识图谱", "标签系统", "自动补全"]}
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.6s" }}>
          <ModuleCard
            href={session ? "/workspace/wanxiang" : "/register"}
            icon={<Network size={24} />}
            title="万象推演"
            subtitle="Wanxiang Sandbox"
            desc="多智能体 AI 预测引擎。构建平行数字世界，千个智能体自由交互推演未来。"
            color="var(--nebula)"
            features={["多智能体", "推演报告", "种子材料", "场景模拟"]}
          />
        </div>
      </section>

      {/* —— Footer —— */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 灵砚 LingYan</span>
          <span>AI驱动的创作者平台</span>
        </div>
      </footer>
    </div>
  );
}
