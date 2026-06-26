import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Star, Zap, Network, ArrowRight, Brain, TrendingUp, Target, Sparkles } from "lucide-react";
import Link from "next/link";
import DashboardAI from "./DashboardAI";

export default async function WorkspaceDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  let stats = { novels: 0, chapters: 0, words: 0, contents: 0, videos: 0, notes: 0, simulations: 0 };
  let recentNovels: { id: string; title: string; updatedAt: Date }[] = [];
  let recentContents: { id: string; title: string; platform: string; updatedAt: Date }[] = [];
  let recentVideos: { id: string; title: string; status: string; updatedAt: Date }[] = [];
  let todayWords = 0;

  if (userId) {
    const [novelCount, chapterAgg, contentCount, videoCount, noteCount, simCount, novels, contents, videos] = await Promise.all([
      prisma.novel.count({ where: { userId } }),
      prisma.chapter.aggregate({ where: { novel: { userId } }, _sum: { wordCount: true }, _count: true }),
      prisma.content.count({ where: { userId } }),
      prisma.videoProject.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
      prisma.simulation.count({ where: { userId } }),
      prisma.novel.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, title: true, updatedAt: true } }),
      prisma.content.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, title: true, platform: true, updatedAt: true } }),
      prisma.videoProject.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, title: true, status: true, updatedAt: true } }),
    ]);

    stats = { novels: novelCount, chapters: chapterAgg._count, words: chapterAgg._sum.wordCount || 0, contents: contentCount, videos: videoCount, notes: noteCount, simulations: simCount };
    recentNovels = novels;
    recentContents = contents;
    recentVideos = videos;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLog = await prisma.writingLog.aggregate({ where: { novel: { userId }, date: today }, _sum: { wordCount: true } });
    todayWords = todayLog._sum.wordCount || 0;
  }

  const platformLabels: Record<string, string> = { wechat: "公众号", xiaohongshu: "小红书", douyin: "抖音", weibo: "微博", zhihu: "知乎", bilibili: "B站" };

  // 快速操作按钮
  const actions = [
    { href: "/workspace/star/create", label: "写小说", icon: <Star size={14} />, color: "var(--cyan)" },
    { href: "/workspace/photon", label: "做视频", icon: <Zap size={14} />, color: "var(--nebula)" },
    { href: "/workspace/notes/new", label: "记笔记", icon: <Brain size={14} />, color: "var(--cyan)" },
    { href: "/workspace/wanxiang", label: "做推演", icon: <Network size={14} />, color: "var(--nebula)" },
  ];

  // 模块卡片
  const modules = [
    { href: "/workspace/star", icon: <Star size={22} />, title: "星图写作", desc: "长篇小说智能创作引擎 · 角色Agent · 去AI味审计 · 7阶段管线", color: "var(--cyan)", size: "large" },
    { href: "/workspace/photon", icon: <Zap size={22} />, title: "光子发布", desc: "短视频AI工厂 · 通义万相 · 分镜脚本 · 一键生成", color: "var(--nebula)", size: "large" },
    { href: "/workspace/notes", icon: <Brain size={18} />, title: "灵思笔记", desc: "知识中枢 · 双向链接 · 图谱", color: "var(--cyan)", size: "small" },
    { href: "/workspace/wanxiang", icon: <Network size={18} />, title: "万象推演", desc: "多智能体模拟推演", color: "var(--nebula)", size: "small" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Hero 横幅 */}
      <div className="relative overflow-hidden rounded-2xl gradient-border-card p-6 md:p-8 stagger-item">
        <div className="relative z-10">
          <p className="text-caption font-mono text-[var(--cyan)] tracking-widest uppercase mb-1">创作工作台</p>
          <h1 className="font-display text-h2 font-bold tracking-tight mb-1">
            欢迎回来，<span className="text-gradient-cyan glow-text">{session?.user?.name ?? "创作者"}</span>
          </h1>
          <p className="text-caption text-muted-foreground max-w-lg">
            今日已创作 {todayWords.toLocaleString()} 字 · 共 {stats.words.toLocaleString()} 字 · {stats.chapters} 章 · {stats.novels} 本小说
          </p>
          {/* 快速操作 */}
          <div className="flex flex-wrap gap-2 mt-4">
            {actions.map((a) => (
              <Link key={a.href} href={a.href}
                className="squash-stretch btn-shimmer ripple inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border border-card-border hover:border-[var(--cyan)]/30 hover:bg-[var(--accent)] transition-all duration-300"
                style={{ color: a.color }}>
                {a.icon} {a.label}
              </Link>
            ))}
          </div>
        </div>
        {/* 背景装饰：渐变光斑 */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle, var(--cyan), transparent 70%)` }} />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-8 pointer-events-none" style={{ background: `radial-gradient(circle, var(--nebula), transparent 70%)` }} />
      </div>

      {/* Bento 网格：主模块 2列 + 小模块 2列 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-item" style={{ animationDelay: "0.12s" }}>
        {/* 左大卡片：星图写作 */}
        <Link href="/workspace/star" className="spotlight-track md:col-span-2 row-span-2 gradient-border-card rounded-2xl p-5 group hover:border-[var(--cyan)]/30 transition-all duration-500 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in oklch, var(--cyan) 12%, transparent)", color: "var(--cyan)" }}>
              <Star size={20} />
            </div>
            <ArrowRight size={14} className="text-muted-foreground group-hover:text-[var(--cyan)] group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-mono text-lg font-bold text-[var(--cyan)] mb-1">星图写作</h3>
          <p className="text-caption text-muted-foreground mb-4">长篇小说智能创作引擎 · 角色Agent系统 · 20维度审计 · 7阶段管线</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { n: stats.novels, l: "本小说" },
              { n: stats.chapters, l: "章节" },
              { n: stats.words.toLocaleString(), l: "字" },
            ].map((item) => (
              <div key={item.l} className="bg-[var(--accent)] rounded-lg p-2.5 text-center">
                <div className="font-mono text-base font-bold text-[var(--cyan)]">{item.n}</div>
                <div className="text-label text-muted-foreground">{item.l}</div>
              </div>
            ))}
          </div>
          {recentNovels.length > 0 && (
            <div className="mt-4 pt-3 border-t border-card-border">
              <p className="text-label text-muted-foreground mb-1.5">最近更新</p>
              {recentNovels.map((n) => (
                <p key={n.id} className="text-caption truncate text-text-secondary">{n.title}</p>
              ))}
            </div>
          )}
        </Link>

        {/* 光子发布 */}
        <Link href="/workspace/photon" className="spotlight-track gradient-border-card rounded-2xl p-5 group hover:border-[var(--nebula)]/30 transition-all duration-500 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in oklch, var(--nebula) 12%, transparent)", color: "var(--nebula)" }}>
              <Zap size={18} />
            </div>
            <ArrowRight size={12} className="text-muted-foreground group-hover:text-[var(--nebula)] group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-mono text-sm font-bold text-[var(--nebula)] mb-1">光子发布</h3>
          <p className="text-caption text-muted-foreground mb-3">短视频AI工厂</p>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-[var(--accent)] rounded-lg p-2 text-center">
              <div className="font-mono text-sm font-bold text-[var(--nebula)]">{stats.contents}</div>
              <div className="text-label text-muted-foreground">文章</div>
            </div>
            <div className="bg-[var(--accent)] rounded-lg p-2 text-center">
              <div className="font-mono text-sm font-bold text-[var(--star)]">{stats.videos}</div>
              <div className="text-label text-muted-foreground">视频</div>
            </div>
          </div>
        </Link>

        {/* 小模块：笔记 + 万象 */}
        <Link href="/workspace/notes" className="space-card rounded-2xl p-4 group hover:border-[var(--cyan)]/20 transition-all duration-500 hover:-translate-y-0.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in oklch, var(--cyan) 10%, transparent)", color: "var(--cyan)" }}>
            <Brain size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-xs font-bold text-[var(--cyan)]">灵思笔记</h3>
            <p className="text-label text-muted-foreground truncate">知识中枢 · 双向链接 · {stats.notes} 篇笔记</p>
          </div>
          <ArrowRight size={12} className="shrink-0 text-muted-foreground group-hover:text-[var(--cyan)] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link href="/workspace/wanxiang" className="space-card rounded-2xl p-4 group hover:border-[var(--nebula)]/20 transition-all duration-500 hover:-translate-y-0.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in oklch, var(--nebula) 10%, transparent)", color: "var(--nebula)" }}>
            <Network size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-xs font-bold text-[var(--nebula)]">万象推演</h3>
            <p className="text-label text-muted-foreground truncate">多智能体模拟 · {stats.simulations} 次推演</p>
          </div>
          <ArrowRight size={12} className="shrink-0 text-muted-foreground group-hover:text-[var(--nebula)] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* AI 助手 */}
      <div className="stagger-item" style={{ animationDelay: "0.18s" }}>
        <DashboardAI />
      </div>

      {/* 快速访问：近期内容 */}
      {(recentContents.length > 0 || recentVideos.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-item" style={{ animationDelay: "0.24s" }}>
          {recentContents.length > 0 && (
            <div className="space-card rounded-xl p-4 hover:border-[var(--cyan)]/20 transition-all">
              <h3 className="text-xs font-bold text-[var(--nebula)] mb-3 flex items-center gap-1.5">
                <Target size={12} /> 近期文章
              </h3>
              <div className="space-y-1.5">
                {recentContents.map((c) => (
                  <Link key={c.id} href={`/workspace/photon/editor/${c.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--accent)] transition-colors group">
                    <span className="text-xs truncate group-hover:text-foreground transition-colors">{c.title || "无标题"}</span>
                    <span className="text-label text-muted-foreground shrink-0 ml-2">{platformLabels[c.platform] || c.platform}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {recentVideos.length > 0 && (
            <div className="space-card rounded-xl p-4 hover:border-[var(--nebula)]/20 transition-all">
              <h3 className="text-xs font-bold text-[var(--star)] mb-3 flex items-center gap-1.5">
                <Sparkles size={12} /> 近期视频
              </h3>
              <div className="space-y-1.5">
                {recentVideos.map((v) => (
                  <Link key={v.id} href={`/workspace/photon/studio/${v.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--accent)] transition-colors group">
                    <span className="text-xs truncate group-hover:text-foreground transition-colors">{v.title}</span>
                    <span className="text-label shrink-0 ml-2" style={{ color: v.status === "done" ? "var(--cyan)" : "var(--muted-foreground)" }}>
                      {v.status === "done" ? "完成" : v.status === "generating" ? "生成中" : "草稿"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!userId && (
        <div className="text-center py-16 stagger-item">
          <p className="text-muted-foreground">请先登录以查看数据</p>
        </div>
      )}
    </div>
  );
}
