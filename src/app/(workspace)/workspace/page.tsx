import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Star, Zap, Network, ArrowRight, Brain, Clock, FileText, Video, TrendingUp, Target, Sparkles } from "lucide-react";
import Link from "next/link";
import DashboardAI from "./DashboardAI";

export default async function WorkspaceDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch comprehensive stats
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

    stats = {
      novels: novelCount,
      chapters: chapterAgg._count,
      words: chapterAgg._sum.wordCount || 0,
      contents: contentCount,
      videos: videoCount,
      notes: noteCount,
      simulations: simCount,
    };
    recentNovels = novels;
    recentContents = contents;
    recentVideos = videos;

    // Today's words
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLog = await prisma.writingLog.aggregate({
      where: { novel: { userId }, date: today },
      _sum: { wordCount: true },
    });
    todayWords = todayLog._sum.wordCount || 0;
  }

  const platformLabels: Record<string, string> = {
    wechat: "公众号", xiaohongshu: "小红书", douyin: "抖音",
    weibo: "微博", zhihu: "知乎", bilibili: "B站",
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="reveal">
        <h1 className="font-mono text-2xl font-bold tracking-wide">
          欢迎回来，<span className="text-gradient-cyan glow-text">{session?.user?.name ?? "创作者"}</span>
        </h1>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 reveal reveal-delay-1">
        {[
          { label: "今日字数", value: todayWords.toLocaleString(), icon: <TrendingUp size={14} />, color: "var(--cyan)", href: "/workspace/star" },
          { label: "小说", value: stats.novels, icon: <FileText size={14} />, color: "var(--cyan)", href: "/workspace/star" },
          { label: "文章", value: stats.contents, icon: <FileText size={14} />, color: "var(--nebula)", href: "/workspace/photon" },
          { label: "视频", value: stats.videos, icon: <Video size={14} />, color: "var(--star)", href: "/workspace/photon" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="space-card rounded-xl p-3 hover:border-[var(--cyan)]/30 transition-all group">
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
            <div className="font-mono text-lg font-bold group-hover:text-[var(--cyan)] transition-colors">{stat.value}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 reveal reveal-delay-2">
        {[
          { href: "/workspace/star/create", label: "写小说", icon: <Star size={16} />, color: "var(--cyan)" },
          { href: "/workspace/photon", label: "做视频", icon: <Zap size={16} />, color: "var(--nebula)" },
          { href: "/workspace/notes/new", label: "记笔记", icon: <Brain size={16} />, color: "var(--cyan)" },
          { href: "/workspace/wanxiang", label: "做推演", icon: <Network size={16} />, color: "var(--nebula)" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-medium border border-card-border hover:border-[var(--cyan)] hover:bg-[var(--accent)] transition-all"
            style={{ color: action.color }}
          >
            {action.icon} {action.label}
          </Link>
        ))}
      </div>

      {/* AI Assistant */}
      <div className="reveal reveal-delay-3">
        <DashboardAI />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 reveal reveal-delay-4">
        {/* Recent Novels */}
        {recentNovels.length > 0 && (
          <div className="space-card rounded-xl p-4">
            <h3 className="text-xs font-bold text-[var(--cyan)] mb-3 flex items-center gap-1.5">
              <Star size={12} /> 星图写作
            </h3>
            <div className="space-y-2">
              {recentNovels.map((novel) => (
                <Link key={novel.id} href={`/workspace/star/${novel.id}`}
                  className="block p-2 rounded-lg hover:bg-[var(--accent)] transition-colors">
                  <p className="text-xs font-medium truncate">{novel.title}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {new Date(novel.updatedAt).toLocaleDateString("zh-CN")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Contents */}
        {recentContents.length > 0 && (
          <div className="space-card rounded-xl p-4">
            <h3 className="text-xs font-bold text-[var(--nebula)] mb-3 flex items-center gap-1.5">
              <FileText size={12} /> 光子发布
            </h3>
            <div className="space-y-2">
              {recentContents.map((content) => (
                <Link key={content.id} href={`/workspace/photon/editor/${content.id}`}
                  className="block p-2 rounded-lg hover:bg-[var(--accent)] transition-colors">
                  <p className="text-xs font-medium truncate">{content.title || "无标题"}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {platformLabels[content.platform] || content.platform}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Videos */}
        {recentVideos.length > 0 && (
          <div className="space-card rounded-xl p-4">
            <h3 className="text-xs font-bold text-[var(--star)] mb-3 flex items-center gap-1.5">
              <Video size={12} /> AI 视频
            </h3>
            <div className="space-y-2">
              {recentVideos.map((video) => (
                <Link key={video.id} href={`/workspace/photon/studio/${video.id}`}
                  className="block p-2 rounded-lg hover:bg-[var(--accent)] transition-colors">
                  <p className="text-xs font-medium truncate">{video.title}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {video.status === "done" ? "已完成" : video.status === "generating" ? "生成中" : "草稿"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 reveal reveal-delay-5">
        {[
          { href: "/workspace/star", icon: <Star size={20} />, title: "星图写作", desc: "长篇小说智能引擎", color: "var(--cyan)" },
          { href: "/workspace/photon", icon: <Zap size={20} />, title: "光子发布", desc: "短视频和内容引擎", color: "var(--nebula)" },
          { href: "/workspace/notes", icon: <Brain size={20} />, title: "灵思笔记", desc: "知识中枢", color: "var(--cyan)" },
          { href: "/workspace/wanxiang", icon: <Network size={20} />, title: "万象推演", desc: "多智能体推演", color: "var(--nebula)" },
        ].map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="flex items-center gap-4 p-4 rounded-xl border border-card-border hover:border-[var(--cyan)]/30 hover:bg-[var(--accent)] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${mod.color}12`, color: mod.color }}>
              {mod.icon}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: mod.color }}>{mod.title}</p>
              <p className="text-[10px] text-muted-foreground">{mod.desc}</p>
            </div>
            <ArrowRight size={14} className="ml-auto text-muted-foreground group-hover:text-[var(--cyan)] transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
