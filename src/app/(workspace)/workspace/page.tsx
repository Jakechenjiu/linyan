import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Star, Zap, Network, ArrowRight, BarChart3, Brain, Clock, FileText, Video, TrendingUp } from "lucide-react";
import SpotlightCard from "@/components/shared/SpotlightCard";
import Link from "next/link";

const modules = [
  {
    href: "/workspace/star",
    icon: <Star size={28} />,
    title: "星图写作",
    subtitle: "Star Writing",
    desc: "长篇智能创作引擎 — AI 对话编辑、五种模式、素材库",
    color: "var(--cyan)",
    features: ["AI 对话编辑", "五种模式", "素材库", "事实追踪"],
  },
  {
    href: "/workspace/photon",
    icon: <Zap size={28} />,
    title: "光子发布",
    subtitle: "Photon Publishing",
    desc: "短视频和内容引擎 — 工作流驱动、多平台适配",
    color: "var(--nebula)",
    features: ["工作流引擎", "多平台", "AI 改写", "导出剪映"],
  },
  {
    href: "/workspace/notes",
    icon: <Brain size={28} />,
    title: "灵思笔记",
    subtitle: "LingSi Notes",
    desc: "知识中枢 — 双向链接、知识图谱、标签系统",
    color: "var(--cyan)",
    features: ["双向链接", "知识图谱", "标签系统", "AI 辅助"],
  },
  {
    href: "/workspace/wanxiang",
    icon: <Network size={28} />,
    title: "万象推演",
    subtitle: "Wanxiang Sandbox",
    desc: "多智能体推演引擎 — 模拟未来、分析趋势",
    color: "var(--nebula)",
    features: ["多智能体", "推演报告", "场景模拟", "数据分析"],
  },
];

export default async function WorkspaceDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch real stats
  let stats = { novels: 0, chapters: 0, words: 0, contents: 0, videos: 0, notes: 0 };
  let recentNovels: { id: string; title: string; updatedAt: Date }[] = [];

  if (userId) {
    const [novelCount, chapterAgg, contentCount, videoCount, noteCount, novels] = await Promise.all([
      prisma.novel.count({ where: { userId } }),
      prisma.chapter.aggregate({ where: { novel: { userId } }, _sum: { wordCount: true }, _count: true }),
      prisma.content.count({ where: { userId } }),
      prisma.videoProject.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
      prisma.novel.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, title: true, updatedAt: true } }),
    ]);

    stats = {
      novels: novelCount,
      chapters: chapterAgg._count,
      words: chapterAgg._sum.wordCount || 0,
      contents: contentCount,
      videos: videoCount,
      notes: noteCount,
    };
    recentNovels = novels;
  }

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Header */}
      <div className="reveal">
        <h1 className="font-mono text-3xl font-bold tracking-wide">
          欢迎回来，<span className="text-gradient-cyan glow-text">{" "}{session?.user?.name ?? "创作者"}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">选择创作模块，开始今天的工作</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 reveal reveal-delay-1">
        {[
          { label: "小说", value: stats.novels, icon: <FileText size={16} />, color: "var(--cyan)" },
          { label: "总字数", value: stats.words.toLocaleString(), icon: <TrendingUp size={16} />, color: "var(--nebula)" },
          { label: "文章", value: stats.contents, icon: <FileText size={16} />, color: "var(--star)" },
          { label: "视频", value: stats.videos, icon: <Video size={16} />, color: "var(--cyan)" },
        ].map((stat) => (
          <div key={stat.label} className="space-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="text-[11px] text-muted-foreground">{stat.label}</span>
            </div>
            <div className="font-mono text-xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent novels */}
      {recentNovels.length > 0 && (
        <div className="reveal reveal-delay-2">
          <h2 className="font-mono text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
            <Clock size={14} /> 最近编辑
          </h2>
          <div className="flex gap-3">
            {recentNovels.map((novel) => (
              <Link
                key={novel.id}
                href={`/workspace/star/${novel.id}`}
                className="space-card rounded-xl p-3 flex-1 hover:border-[var(--cyan)]/30 transition-all"
              >
                <p className="text-sm font-medium truncate">{novel.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(novel.updatedAt).toLocaleDateString("zh-CN")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Module Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((mod, i) => (
          <div key={mod.href} className={`reveal reveal-delay-${i + 2}`}>
            <SpotlightCard href={mod.href} color={mod.color}>
              <div className="relative z-10">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out"
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
                      className="text-[10px] px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform duration-300"
                      style={{ background: `${mod.color}10`, color: mod.color }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div
                  className="flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all duration-300"
                  style={{ color: mod.color }}
                >
                  进入 <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </SpotlightCard>
          </div>
        ))}
      </div>
    </div>
  );
}
