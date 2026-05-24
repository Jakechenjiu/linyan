import { auth } from "@/lib/auth";
import Link from "next/link";
import { Star, Zap, FlaskConical, ArrowRight, BarChart3 } from "lucide-react";

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
    href: "/workspace/lab",
    icon: <FlaskConical size={28} />,
    title: "灵感实验室",
    subtitle: "Inspiration Lab",
    desc: "脑图规划与短篇验证 — 快速探索创意可能性",
    color: "var(--star)",
    features: ["思维脑图", "短篇生成", "Prompt库"],
  },
];

export default async function WorkspaceDashboard() {
  const session = await auth();

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">
          欢迎回来，<span className="text-[var(--cyan)]">{session?.user?.name ?? "创作者"}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">选择创作模块，开始今天的工作</p>
      </div>

      {/* Module Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="space-card group rounded-2xl p-6 relative overflow-hidden"
            style={{ borderColor: `${mod.color}20` }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 0%, ${mod.color}10, transparent 60%)` }}
            />
            <div className="relative z-10">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ background: `${mod.color}15`, color: mod.color }}
              >
                {mod.icon}
              </div>
              <h3 className="font-mono text-xl font-bold tracking-wide mb-1" style={{ color: mod.color }}>
                {mod.title}
              </h3>
              <p className="text-[11px] text-muted-foreground mb-2">{mod.subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{mod.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {mod.features.map((f) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${mod.color}10`, color: mod.color }}>
                    {f}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: mod.color }}>
                进入 <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats (placeholder) */}
      <div className="space-card rounded-2xl p-6">
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
