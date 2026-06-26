import { auth } from "@/lib/auth";
import Link from "next/link";
import ParticleBg from "@/components/brand/ParticleBg";
import CursorGlow from "@/components/brand/CursorGlow";
import ModuleCard from "@/components/shared/ModuleCard";
import { Logo } from "@/components/brand";
import { Star, Zap, Network, Brain, ArrowRight, Check, Sparkles, Shield, Globe, Cpu } from "lucide-react";
import { CinematicHero } from "./CinematicHero";
import PublicNav from "@/components/layout/PublicNav";

const features = [
  {
    icon: <Sparkles size={20} />,
    title: "AI 对话编辑",
    desc: "选中文字，跟 AI 说怎么改，直接改正文",
    color: "var(--cyan)",
  },
  {
    icon: <Cpu size={20} />,
    title: "多智能体推演",
    desc: "20种角色预设，模拟未来走向",
    color: "var(--nebula)",
  },
  {
    icon: <Globe size={20} />,
    title: "多平台适配",
    desc: "一键适配公众号/小红书/抖音/知乎/B站",
    color: "var(--star)",
  },
  {
    icon: <Shield size={20} />,
    title: "数据安全",
    desc: "用户自带 API Key，平台不存储敏感信息",
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
      <CursorGlow />

      {/* Nav */}
      <PublicNav hasSession={hasSession} />

      {/* Hero */}
      <CinematicHero hasSession={hasSession} />

      {/* Module Cards — Collage Layout */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="collage-grid">
          {/* 主卡片 span7 */}
          <div className="collage-item-main animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <ModuleCard
              href={hasSession ? "/workspace/star" : "/register"}
              icon={<Star size={24} />}
              title="星图写作"
              subtitle="Star Writing"
              desc="长篇小说智能引擎。AI对话编辑、五种写作模式、素材库自动注入、角色Agent系统、20维度审计。"
              color="var(--cyan)"
              features={["AI对话编辑", "五种模式", "素材库", "事实追踪", "角色Agent"]}
            />
          </div>
          {/* 侧卡片 span5 + 负margin重叠 */}
          <div className="collage-item-side animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <ModuleCard
              href={hasSession ? "/workspace/photon" : "/register"}
              icon={<Zap size={24} />}
              title="光子发布"
              subtitle="Photon Publishing"
              desc="短视频和内容引擎。一键生成、多平台适配、导出剪映。"
              color="var(--nebula)"
              features={["一键生成", "多平台", "AI改写", "导出剪映"]}
            />
          </div>
          {/* 底部卡片 span4 + 向上覆盖 */}
          <div className="collage-item-accent animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <ModuleCard
              href={hasSession ? "/workspace/notes" : "/register"}
              icon={<Brain size={20} />}
              title="灵思笔记"
              subtitle="LingSi Notes"
              desc="知识中枢。双向链接、知识图谱、自动归纳。"
              color="var(--cyan)"
              features={["双向链接", "知识图谱", "自动归纳", "AI辅助"]}
            />
          </div>
          <div className="collage-item-accent animate-slide-up" style={{ animationDelay: "0.55s" }}>
            <ModuleCard
              href={hasSession ? "/workspace/wanxiang" : "/register"}
              icon={<Network size={20} />}
              title="万象推演"
              subtitle="Wanxiang Sandbox"
              desc="多智能体推演引擎。场景模板、AI深度分析、报告导出。"
              color="var(--nebula)"
              features={["场景模板", "AI分析", "报告导出", "笔记联动"]}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <h2 className="font-mono text-2xl font-bold text-center mb-12">核心能力</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="text-center space-y-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
                style={{ background: `${f.color}12`, color: f.color }}
              >
                {f.icon}
              </div>
              <h3 className="text-sm font-bold">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — Blueprint Aesthetic */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20 below-fold">
        <h2 className="font-mono text-2xl font-bold text-center mb-12">工作流程</h2>
        <div className="blueprint-empty halftone-overlay">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {[
            { step: "01", title: "输入", desc: "一句话描述需求" },
            { step: "02", title: "生成", desc: "AI 自动生成内容" },
            { step: "03", title: "精修", desc: "对话式修改优化" },
            { step: "04", title: "分发", desc: "多平台一键发布" },
          ].map((s) => (
            <div key={s.step} className="text-center space-y-2">
              <div className="font-mono text-2xl font-bold text-[var(--cyan)]">{s.step}</div>
              <h3 className="text-sm font-bold">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof — Anti-Vibe微瑕疵 */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-20 text-center below-fold">
        <div className="space-card rounded-2xl p-8 anti-vibe" style={{ "--jitter": "-0.3deg", "--jitter-x": "-1px" } as React.CSSProperties}>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            &ldquo;灵砚让我一个人就能完成整个创作团队的工作。从写小说到做视频，一个平台搞定。&rdquo;
          </p>
          <p className="text-xs text-muted-foreground">— 灵砚用户</p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="font-mono text-2xl font-bold mb-4">开始你的创作</h2>
        <p className="text-sm text-muted-foreground mb-8">
          免费注册，基础功能永久可用
        </p>
        <Link
          href={hasSession ? "/workspace" : "/register"}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-[var(--cyan)] hover:shadow-[0_0_32px_rgba(0,229,255,0.4)] transition-all"
          style={{ color: "#0a0e17" }}
        >
          {hasSession ? "进入工作台" : "免费注册"} <ArrowRight size={18} />
        </Link>
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
