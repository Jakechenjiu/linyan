import { auth } from "@/lib/auth";
import Link from "next/link";
import ParticleBg from "@/components/brand/ParticleBg";
import ModuleCard from "@/components/shared/ModuleCard";
import { Logo } from "@/components/brand";
import { Star, Zap, Network, Brain, ArrowRight, Wand2, FileText, Video, MessageSquare } from "lucide-react";
import { CinematicHero } from "./CinematicHero";

const workflowSteps = [
  {
    step: "01",
    icon: <MessageSquare size={20} />,
    title: "告诉 AI 你要什么",
    desc: "用自然语言描述需求，AI 理解你的意图",
    color: "var(--cyan)",
  },
  {
    step: "02",
    icon: <Wand2 size={20} />,
    title: "AI 生成初稿",
    desc: "文字、脚本、大纲，秒级生成",
    color: "var(--nebula)",
  },
  {
    step: "03",
    icon: <FileText size={20} />,
    title: "对话式精修",
    desc: "跟 AI 说怎么改，直接改正文",
    color: "var(--star)",
  },
  {
    step: "04",
    icon: <Video size={20} />,
    title: "一键分发",
    desc: "多平台适配，导出剪映，直接发布",
    color: "var(--cyan)",
  },
];

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

      {/* Nav */}
      <header className="relative z-10 border-b border-white/[0.04] bg-[var(--bg-abyss)]/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto w-full">
          <Logo size="md" />
          <div className="flex items-center gap-5">
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              探索
            </Link>
            {hasSession ? (
              <Link
                href="/workspace"
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all"
                style={{ color: "#0a0e17" }}
              >
                进入工作台
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all"
                  style={{ color: "#0a0e17" }}
                >
                  免费注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <CinematicHero hasSession={hasSession} />

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <h2 className="font-mono text-2xl font-bold text-center mb-12 text-[var(--text-primary)]">
          工作流程
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {workflowSteps.map((step, i) => (
            <div
              key={step.step}
              className="space-card rounded-xl p-5 text-center group hover:border-[var(--cyan)]/30 transition-all"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="font-mono text-xs text-muted-foreground mb-3">{step.step}</div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110"
                style={{ background: `${step.color}12`, color: step.color }}
              >
                {step.icon}
              </div>
              <h3 className="text-sm font-bold mb-1">{step.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Module Cards */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <h2 className="font-mono text-2xl font-bold text-center mb-12 text-[var(--text-primary)]">
          四大模块
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <ModuleCard
            href={hasSession ? "/workspace/star" : "/register"}
            icon={<Star size={24} />}
            title="星图写作"
            subtitle="Star Writing"
            desc="长篇小说智能引擎。AI 对话编辑、五种写作模式、素材库自动注入。"
            color="var(--cyan)"
            features={["AI对话编辑", "五种模式", "素材库", "事实追踪"]}
          />
          <ModuleCard
            href={hasSession ? "/workspace/photon" : "/register"}
            icon={<Zap size={24} />}
            title="光子发布"
            subtitle="Photon Publishing"
            desc="短视频和内容引擎。工作流驱动、多平台适配、一键导出剪映。"
            color="var(--nebula)"
            features={["工作流引擎", "多平台", "AI改写", "导出剪映"]}
          />
          <ModuleCard
            href={hasSession ? "/workspace/notes" : "/register"}
            icon={<Brain size={24} />}
            title="灵思笔记"
            subtitle="LingSi Notes"
            desc="知识中枢。双向链接、知识图谱、标签系统。"
            color="var(--cyan)"
            features={["双向链接", "知识图谱", "标签系统", "AI辅助"]}
          />
          <ModuleCard
            href={hasSession ? "/workspace/wanxiang" : "/register"}
            icon={<Network size={24} />}
            title="万象推演"
            subtitle="Wanxiang Sandbox"
            desc="多智能体推演引擎。模拟未来、分析趋势、生成报告。"
            color="var(--nebula)"
            features={["多智能体", "推演报告", "场景模拟", "数据分析"]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="space-card rounded-2xl p-10">
          <h2 className="font-mono text-2xl font-bold mb-4 text-[var(--text-primary)]">
            开始你的创作
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            免费注册，基础功能永久可用。<br />
            输入会员码解锁全部能力。
          </p>
          <Link
            href={hasSession ? "/workspace" : "/register"}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-[var(--cyan)] hover:shadow-[0_0_32px_rgba(0,229,255,0.4)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            {hasSession ? "进入工作台" : "免费注册"} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 灵砚 LingYan</span>
          <span>AI 驱动的创作者平台</span>
        </div>
      </footer>
    </div>
  );
}
