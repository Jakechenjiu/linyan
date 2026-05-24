import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, User, Clock, Eye } from "lucide-react";
import Link from "next/link";

const platformLabels: Record<string, string> = {
  wechat: "公众号", xiaohongshu: "小红书", douyin: "抖音",
  weibo: "微博", zhihu: "知乎", bilibili: "B站", novel: "小说",
};

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { type } = await searchParams;

  let title = "内容详情";
  if (type === "story") {
    const story = await prisma.story.findUnique({ where: { id } });
    if (story) title = `${story.title} - 灵砚`;
  } else {
    const content = await prisma.content.findUnique({ where: { id } });
    if (content) title = `${content.title} - 灵砚`;
  }
  return { title, description: "灵砚 LingYan AI创作平台" };
}

export default async function ExploreDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { type } = await searchParams;

  let item: {
    title: string;
    body: string;
    wordCount: number;
    platform?: string;
    contentType?: string;
    createdAt: Date;
    updatedAt: Date;
    user: { name: string | null; email: string };
  } | null = null;

  if (type === "story") {
    const story = await prisma.story.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (story && story.isPublic && story.status === "published") {
      item = {
        title: story.title,
        body: story.content,
        wordCount: story.wordCount,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
        user: story.user,
      };
    }
  } else {
    const content = await prisma.content.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (content && content.isPublic && content.status === "published") {
      item = {
        title: content.title,
        body: content.body,
        wordCount: content.wordCount,
        platform: content.platform,
        contentType: content.contentType,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
        user: content.user,
      };
    }
  }

  if (!item) notFound();

  const readTime = Math.max(1, Math.ceil(item.wordCount / 400));

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        返回探索
      </Link>

      <article>
        <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-wide mb-4">
          {item.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-8 pb-6 border-b border-card-border">
          <span className="flex items-center gap-1">
            <User size={12} />
            {item.user.name ?? item.user.email}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {item.createdAt.toLocaleDateString("zh-CN")}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} />
            约 {readTime} 分钟阅读
          </span>
          <span>{item.wordCount.toLocaleString()} 字</span>
          {item.platform && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: "var(--cyan-soft)", color: "var(--cyan)" }}>
              {platformLabels[item.platform] ?? item.platform}
            </span>
          )}
        </div>

        <div className="prose prose-invert prose-sm max-w-none leading-relaxed whitespace-pre-wrap text-[15px]">
          {item.body}
        </div>
      </article>
    </div>
  );
}
