import { auth } from "@/lib/auth";
import { Star, Zap, Network, ArrowRight, BarChart3, Brain } from "lucide-react";
import SpotlightCard from "@/components/shared/SpotlightCard";

const modules = [
  {
    href: "/workspace/star",
    icon: <Star size={28} />,
    title: "星图写作",
    subtitle: "Star Writing",
    desc: "长篇智能创作引擎 — 章节管理、AI续写、写作分析",
    color: "var(--cyan)",
    features: ["AI 续写", "章节管理", "写作统计"],
  },
  {
    href: "/workspace/photon",
    icon: <Zap size={28} />,
    title: "光子发布",
    subtitle: "Photon Publishing",
    desc: "自媒体爆款流水线 — 模板驱动、多平台一键生成",
    color: "var(--nebula)",
    features: ["模板工坊", "批量生成", "内容日历"],
  },
  {
    href: "/workspace/notes",
    icon: <Brain size={28} />,
    title: "灵思笔记",
    subtitle: "LingSi Notes",
    desc: "知识中枢 — Obsidian 风格双向链接、知识图谱可视化",
    color: "var(--cyan)",
    features: ["双向链接", "知识图谱", "标签系统"],
  },
  {
    href: "/workspace/wanxiang",
    icon: <Network size={28} />,
    title: "万象推演",
    subtitle: "Wanxiang Sandbox",
    desc: "多智能体推演引擎 — 构建平行数字世界，预测未来走向",
    color: "var(--nebula)",
    features: ["智能体模拟", "推演报告", "知识图谱"],
  },
];

export default async function WorkspaceDashboard() {
  const session = await auth();

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="font-mono text-3xl font-bold tracking-wide">
          欢迎回来，<span className="text-gradient-cyan glow-text">{" "}{session?.user?.name ?? "创作者"}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">选择创作模块，开始今天的工作</p>
      </div>

      {/* Module Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((mod, i) => (
          <div key={mod.href} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <SpotlightCard href={mod.href} color={mod.color}>
              <div className="relative z-10">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
                  style={{ background: `${mod.color}15`, color: mod.color }}
                >
                  {mod.icon}
                </div>
                <h3
                  className="font-mono text-xl font-bold tracking-wide mb-1 group-hover:translate-x-1 transition-transform duration-300"
                  style={{ color: mod.color }}
                >
                  {mod.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mb-2">{mod.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{mod.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {mod.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                      style={{ background: `${mod.color}10`, color: mod.color }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div
                  className="flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all"
                  style={{ color: mod.color }}
                >
                  进入 <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </SpotlightCard>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="liquid-glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-[var(--cyan)]" />
          创作概览
        </h2>
        <div className="grid grid-cols-3 gap-8 text-center">
          {[
            { label: "创作内容", value: "—" },
            { label: "总字数", value: "—" },
            { label: "覆盖平台", value: "—" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-mono text-2xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
