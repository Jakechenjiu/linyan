import { auth } from "@/lib/auth";
import Link from "next/link";
import ParticleBg from "@/components/brand/ParticleBg";
import CursorGlow from "@/components/brand/CursorGlow";
import ModuleCard from "@/components/shared/ModuleCard";
import { Logo } from "@/components/brand";
import { Star, Zap, Network, Brain } from "lucide-react";
import { CinematicHero } from "./CinematicHero";

export default async function Home() {
  let session;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  const hasSession = !!session?.user;

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
            {hasSession ? (
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
      <CinematicHero hasSession={hasSession} />

      {/* —— Module Cards —— */}
      <section className="relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto px-6 pb-24">
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <ModuleCard
            href={hasSession ? "/workspace/star" : "/register"}
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
            href={hasSession ? "/workspace/photon" : "/register"}
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
            href={hasSession ? "/workspace/notes" : "/register"}
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
            href={hasSession ? "/workspace/wanxiang" : "/register"}
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
