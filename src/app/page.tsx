import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/brand";
import ParticleBg from "@/components/brand/ParticleBg";
import ModuleCard from "@/components/shared/ModuleCard";
import { Star, Zap, FlaskConical, ArrowRight, ChevronDown } from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      <ParticleBg />

      {/* —— Nav —— */}
      <header className="relative z-10 glass-card border-b border-white/[0.04] rounded-none mx-0">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto w-full">
          <Logo size="md" />
          <div className="flex items-center gap-5">
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              探索
            </Link>
            {session ? (
              <Link
                href="/workspace"
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all duration-300 btn-shimmer"
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
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all duration-300 btn-shimmer"
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
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-28 pb-10 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="animate-fade-in mb-8">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide border border-white/[0.06] bg-white/[0.02] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse-slow" />
            AI 创作平台 · 灵砚 LingYan
          </span>
        </div>

        {/* Logo mark */}
        <div className="mb-8 animate-float">
          <Logo size="lg" />
        </div>

        {/* Headline */}
        <h1 className="font-mono text-4xl md:text-6xl font-bold tracking-tight mb-5 animate-slide-up">
          <span className="glow-text-strong">让AI成为</span>
          <br />
          <span className="text-gradient-cyan">你的创作引擎</span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "0.08s" }}>
          星图写作 · 光子发布 · 灵感实验室 —— 一个平台，覆盖长篇创作、自媒体爆款、创意实验的全部流程
        </p>

        <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <Link
            href={session ? "/workspace" : "/register"}
            className="px-7 py-3.5 rounded-xl text-base font-bold bg-[var(--cyan)] hover:shadow-[0_0_28px_rgba(0,229,255,0.35)] transition-all duration-300 flex items-center gap-2 btn-shimmer hover-lift"
            style={{ color: "#0a0e17" }}
          >
            {session ? "进入工作台" : "开始创作"} <ArrowRight size={18} />
          </Link>
          <Link
            href="/explore"
            className="px-7 py-3.5 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
          >
            探索内容
          </Link>
        </div>

        {/* Scroll hint */}
        <div className="mt-16 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <ChevronDown size={20} className="text-muted-foreground/40 animate-float" style={{ animationDuration: "3s" }} />
        </div>
      </section>

      {/* —— Module Cards —— */}
      <section className="relative z-10 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto px-6 pb-24">
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
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
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
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
        <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <ModuleCard
            href={session ? "/workspace/lab" : "/register"}
            icon={<FlaskConical size={24} />}
            title="灵感实验室"
            subtitle="Inspiration Lab"
            desc="思维脑图与短篇快速验证。Markdown 大纲转可视化脑图，Prompt 驱动创意爆发。"
            color="var(--star)"
            features={["脑图", "短篇生成", "Prompt库", "快速原型"]}
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
