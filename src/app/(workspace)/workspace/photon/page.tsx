import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Sparkles, Layers, Calendar, TrendingUp, Plus, Video, Play } from "lucide-react";
import ImportButton from "@/components/shared/ImportButton";

const platforms = [
  { id: "wechat", label: "公众号", icon: "📱", color: "#07c160" },
  { id: "xiaohongshu", label: "小红书", icon: "📕", color: "#ff2442" },
  { id: "douyin", label: "抖音", icon: "🎵", color: "#000000" },
  { id: "weibo", label: "微博", icon: "📢", color: "#e6162d" },
  { id: "zhihu", label: "知乎", icon: "💡", color: "#0066ff" },
  { id: "bilibili", label: "B站", icon: "📺", color: "#fb7299" },
];

export default async function PhotonPage() {
  let session;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  const userId = session?.user?.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentContents: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let videoProjects: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stats: any[] = [];
  let fetchError: string | null = null;

  if (userId) {
    try {
      [recentContents, videoProjects, stats] = await Promise.all([
        prisma.content.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
        prisma.videoProject.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: { _count: { select: { clips: true } } },
        }),
        prisma.content.groupBy({
          by: ["status"],
          where: { userId },
          _count: true,
        }),
      ]);
    } catch (e) {
      console.error("Failed to fetch photon data:", e);
      fetchError = "数据加载失败，请刷新页面重试。";
    }
  }

  const publishedCount = stats.find((s) => s.status === "published")?._count ?? 0;
  const draftCount = stats.find((s) => s.status === "draft")?._count ?? 0;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-wide">光子发布</h1>
          <p className="text-sm text-muted-foreground mt-1">自媒体爆款流水线 + AI 短视频工厂</p>
        </div>
        <ImportButton type="content" accept=".txt,.md,.json" multiple />
      </div>

      {fetchError && (
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-400">
          {fetchError}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { href: "/workspace/photon/batch", label: "AI 视频工厂", icon: <Video size={16} />, color: "var(--nebula)" },
          { href: "/workspace/photon/templates", label: "模板工坊", icon: <Layers size={16} />, color: "var(--cyan)" },
          { href: "/workspace/photon/batch", label: "批量生成", icon: <Sparkles size={16} />, color: "var(--star)" },
          { href: "/workspace/photon/calendar", label: "内容日历", icon: <Calendar size={16} />, color: "var(--star)" },
          { href: "/workspace/photon/analytics", label: "数据分析", icon: <TrendingUp size={16} />, color: "var(--cyan)" },
        ].map((btn) => (
          <Link
            key={btn.href + btn.label}
            href={btn.href}
            className="space-card rounded-xl p-4 text-center group"
            style={{ borderColor: `${btn.color}20` }}
          >
            <div className="flex justify-center mb-2" style={{ color: btn.color }}>
              {btn.icon}
            </div>
            <span className="text-xs font-medium group-hover:text-[var(--cyan)] transition-colors">
              {btn.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Platform cards */}
      <div>
        <h2 className="font-mono text-lg font-bold mb-4">支持平台</h2>
        <div className="grid grid-cols-6 gap-3">
          {platforms.map((p) => (
            <div
              key={p.id}
              className="space-card rounded-xl p-4 text-center"
              style={{ borderColor: `${p.color}20` }}
            >
              <span className="text-2xl">{p.icon}</span>
              <p className="text-xs mt-1 font-medium" style={{ color: p.color }}>
                {p.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats + recent + video projects */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent contents */}
        <div className="space-card rounded-xl p-5">
          <h2 className="font-mono text-lg font-bold mb-4">最近内容</h2>
          {recentContents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">还没有内容</p>
          ) : (
            <div className="space-y-2">
              {recentContents.map((c) => (
                <Link
                  key={c.id}
                  href={`/workspace/photon/editor/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--accent)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-[11px] text-muted-foreground">{c.platform} · {c.wordCount} 字</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === "published" ? "bg-[var(--cyan-soft)] text-[var(--cyan)]" : "bg-[var(--accent)] text-muted-foreground"}`}>
                    {c.status === "published" ? "已发布" : "草稿"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Video projects */}
        <div className="space-card rounded-xl p-5">
          <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
            <Play size={14} className="text-[var(--nebula)]" /> AI 短视频
          </h2>
          {videoProjects.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">还没有视频项目</p>
              <Link
                href="/workspace/photon/batch"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--nebula-soft)] text-[var(--nebula)] hover:bg-[var(--nebula)] hover:text-white transition-all"
              >
                <Plus size={14} /> 创建视频
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {videoProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/workspace/photon/studio/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--accent)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.platform === "douyin" ? "抖音" : p.platform} · {p._count.clips} 分镜
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    p.status === "done" ? "bg-green-500/10 text-green-400" :
                    p.status === "generating" ? "bg-[var(--star)]/10 text-[var(--star)]" :
                    "bg-[var(--accent)] text-muted-foreground"
                  }`}>
                    {p.status === "draft" ? "草稿" : p.status === "generating" ? "生成中" : p.status === "ready" ? "待合成" : p.status === "done" ? "已完成" : p.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="space-card rounded-xl p-5">
            <h2 className="font-mono text-lg font-bold mb-4">概览</h2>
            <div className="space-y-4">
              <div>
                <span className="text-2xl font-mono font-bold text-[var(--cyan)]">{publishedCount}</span>
                <p className="text-xs text-muted-foreground">已发布</p>
              </div>
              <div>
                <span className="text-2xl font-mono font-bold text-[var(--nebula)]">{draftCount}</span>
                <p className="text-xs text-muted-foreground">草稿</p>
              </div>
              <div>
                <span className="text-2xl font-mono font-bold text-[var(--star)]">{videoProjects.length}</span>
                <p className="text-xs text-muted-foreground">视频项目</p>
              </div>
              <Link
                href="/workspace/photon/batch"
                className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
                style={{ color: "#0a0e17" }}
              >
                <Plus size={16} /> 创建新内容
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
