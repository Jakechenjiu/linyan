import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BarChart3, TrendingUp, FileText, Layers } from "lucide-react";

const platformMap: Record<string, string> = {
  wechat: "公众号", xiaohongshu: "小红书", douyin: "抖音",
  weibo: "微博", zhihu: "知乎", bilibili: "B站", novel: "小说",
};

export default async function PhotonAnalyticsPage() {
  const session = await auth();
  const contents = await prisma.content.findMany({
    where: { userId: session?.user?.id },
    select: { platform: true, wordCount: true, status: true, createdAt: true },
  });

  const totalWords = contents.reduce((s, c) => s + c.wordCount, 0);
  const publishedCount = contents.filter((c) => c.status === "published").length;
  const draftCount = contents.filter((c) => c.status === "draft").length;

  const byPlatform: Record<string, number> = {};
  for (const c of contents) {
    byPlatform[c.platform] = (byPlatform[c.platform] ?? 0) + 1;
  }
  const maxPlatform = Math.max(1, ...Object.values(byPlatform));

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">数据分析</h1>
        <p className="text-sm text-muted-foreground mt-1">内容创作统计</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "总内容", value: String(contents.length), icon: <FileText size={18} />, color: "var(--cyan)" },
          { label: "已发布", value: String(publishedCount), icon: <TrendingUp size={18} />, color: "var(--nebula)" },
          { label: "草稿", value: String(draftCount), icon: <Layers size={18} />, color: "var(--star)" },
          { label: "总字数", value: totalWords.toLocaleString(), icon: <BarChart3 size={18} />, color: "var(--cyan)" },
        ].map((stat) => (
          <div key={stat.label} className="space-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="font-mono text-xl font-bold">{stat.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Platform distribution */}
      <div className="space-card rounded-2xl p-6">
        <h2 className="font-mono text-lg font-bold mb-6 flex items-center gap-2">
          <BarChart3 size={20} className="text-[var(--cyan)]" />
          平台分布
        </h2>
        <div className="space-y-3">
          {Object.entries(byPlatform).map(([platform, count]) => (
            <div key={platform} className="flex items-center gap-3">
              <span className="text-xs w-16 text-right text-muted-foreground">
                {platformMap[platform] ?? platform}
              </span>
              <div className="flex-1 h-6 rounded-full bg-[var(--accent)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(count / maxPlatform) * 100}%`,
                    background: "var(--cyan)",
                    opacity: 0.6,
                  }}
                />
              </div>
              <span className="text-xs font-mono w-8">{count}</span>
            </div>
          ))}
          {Object.keys(byPlatform).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>
          )}
        </div>
      </div>
    </div>
  );
}
