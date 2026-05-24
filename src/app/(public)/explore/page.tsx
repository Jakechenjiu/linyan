import { prisma } from "@/lib/db";
import Link from "next/link";
import { Clock, User } from "lucide-react";

const platformLabels: Record<string, { label: string; color: string }> = {
  wechat: { label: "公众号", color: "#07c160" },
  xiaohongshu: { label: "小红书", color: "#ff2442" },
  douyin: { label: "抖音", color: "#000000" },
  weibo: { label: "微博", color: "#e6162d" },
  zhihu: { label: "知乎", color: "#0066ff" },
  bilibili: { label: "B站", color: "#fb7299" },
  novel: { label: "小说", color: "var(--cyan)" },
};

const typeLabels: Record<string, string> = {
  headline: "标题",
  article: "文章",
  script: "脚本",
  chapter: "章节",
};

type ExploreItem = {
  id: string;
  title: string;
  kind: "content" | "story";
  body: string;
  updatedAt: Date;
  user: { name: string | null };
  platform?: string;
  contentType?: string;
};

export default async function ExplorePage() {
  const contents = await prisma.content.findMany({
    where: { status: "published", isPublic: true },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { name: true } } },
    take: 50,
  });

  const stories = await prisma.story.findMany({
    where: { status: "published", isPublic: true },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { name: true } } },
    take: 50,
  });

  const allItems: ExploreItem[] = [
    ...contents.map((c): ExploreItem => ({
      id: c.id, title: c.title, kind: "content", body: c.body,
      updatedAt: c.updatedAt, user: c.user, platform: c.platform, contentType: c.contentType,
    })),
    ...stories.map((s): ExploreItem => ({
      id: s.id, title: s.title, kind: "story", body: s.content,
      updatedAt: s.updatedAt, user: s.user,
    })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="font-mono text-3xl font-bold tracking-wide glow-text">探索内容</h1>
        <p className="text-sm text-muted-foreground mt-2">发现创作者们的精彩作品</p>
      </div>

      {allItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg mb-2">暂无公开内容</p>
          <p className="text-sm text-muted-foreground">成为第一个分享作品的创作者</p>
          <Link
            href="/register"
            className="inline-block mt-6 px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            开始创作
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allItems.map((item) => {
            const href =
              item.kind === "content"
                ? `/explore/${item.id}?type=content`
                : `/explore/${item.id}?type=story`;
            const platform = item.kind === "content" && item.platform ? platformLabels[item.platform] ?? null : null;

            return (
              <Link
                key={item.id}
                href={href}
                className="space-card group rounded-xl p-5 block"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-mono font-bold text-sm leading-snug line-clamp-2 group-hover:text-[var(--cyan)] transition-colors">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                  {(item.kind === "content" ? item.body : item.content)?.slice(0, 120) ?? "暂无摘要"}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {item.user.name ?? "匿名"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {item.updatedAt.toLocaleDateString("zh-CN")}
                  </span>
                  {platform && (
                    <span
                      className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: `${platform.color}18`, color: platform.color }}
                    >
                      {platform.label}
                    </span>
                  )}
                  {item.kind === "content" && (
                    <span className="text-[10px] text-muted-foreground">
                      {typeLabels[item.contentType] ?? item.contentType}
                    </span>
                  )}
                  {item.kind === "story" && (
                    <span
                      className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: "var(--star-soft)", color: "var(--star)" }}
                    >
                      短篇
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
