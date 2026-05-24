import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FileText, Sparkles, Layers, Calendar, TrendingUp, Plus } from "lucide-react";

const platforms = [
  { id: "wechat", label: "公众号", icon: "📱", color: "#07c160" },
  { id: "xiaohongshu", label: "小红书", icon: "📕", color: "#ff2442" },
  { id: "douyin", label: "抖音", icon: "🎵", color: "#000000" },
  { id: "weibo", label: "微博", icon: "📢", color: "#e6162d" },
  { id: "zhihu", label: "知乎", icon: "💡", color: "#0066ff" },
  { id: "bilibili", label: "B站", icon: "📺", color: "#fb7299" },
];

export default async function PhotonPage() {
  const session = await auth();
  const recentContents = await prisma.content.findMany({
    where: { userId: session?.user?.id },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  const stats = await prisma.content.groupBy({
    by: ["status"],
    where: { userId: session?.user?.id },
    _count: true,
  });

  const publishedCount = stats.find((s) => s.status === "published")?._count ?? 0;
  const draftCount = stats.find((s) => s.status === "draft")?._count ?? 0;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">光子发布</h1>
        <p className="text-sm text-muted-foreground mt-1">自媒体爆款流水线</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { href: "/workspace/photon/templates", label: "模板工坊", icon: <Layers size={16} />, color: "var(--cyan)" },
          { href: "/workspace/photon/batch", label: "批量生成", icon: <Sparkles size={16} />, color: "var(--nebula)" },
          { href: "/workspace/photon/calendar", label: "内容日历", icon: <Calendar size={16} />, color: "var(--star)" },
          { href: "/workspace/photon/analytics", label: "数据分析", icon: <TrendingUp size={16} />, color: "var(--cyan)" },
        ].map((btn) => (
          <Link
            key={btn.href}
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

      {/* Stats + recent */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-card rounded-xl p-5 col-span-2">
          <h2 className="font-mono text-lg font-bold mb-4">最近内容</h2>
          {recentContents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              还没有内容，去模板工坊开始创作
            </p>
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
                    <p className="text-[11px] text-muted-foreground">
                      {c.platform} · {c.wordCount} 字
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      c.status === "published"
                        ? "bg-[var(--cyan-soft)] text-[var(--cyan)]"
                        : "bg-[var(--accent)] text-muted-foreground"
                    }`}
                  >
                    {c.status === "published" ? "已发布" : "草稿"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-card rounded-xl p-5">
            <h2 className="font-mono text-lg font-bold mb-4">概览</h2>
            <div className="space-y-4">
              <div>
                <span className="text-2xl font-mono font-bold text-[var(--cyan)]">
                  {publishedCount}
                </span>
                <p className="text-xs text-muted-foreground">已发布</p>
              </div>
              <div>
                <span className="text-2xl font-mono font-bold text-[var(--nebula)]">
                  {draftCount}
                </span>
                <p className="text-xs text-muted-foreground">草稿</p>
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
