import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, BookOpen, BarChart3, Trash2, Clock, Edit3, Target } from "lucide-react";
import ImportButton from "@/components/shared/ImportButton";
import { revalidatePath } from "next/cache";
import { genrePresets } from "@/data/genre-presets";

async function deleteNovel(id: string) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.novel.deleteMany({ where: { id, userId: session.user.id } });
  revalidatePath("/workspace/star");
}

const statusLabels: Record<string, string> = {
  planning: "规划中",
  writing: "连载中",
  completed: "已完结",
  paused: "暂停",
};

export default async function StarPage() {
  let session;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  let novels: any[] = [];
  let fetchError: string | null = null;

  if (session?.user?.id) {
    try {
      novels = await prisma.novel.findMany({
        where: { userId: session.user.id },
        include: {
          _count: { select: { chapters: true } },
          chapters: { select: { wordCount: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    } catch (e) {
      console.error("Failed to fetch novels:", e);
      fetchError = "数据加载失败，请刷新页面重试。";
    }
  }

  // Get today's writing logs for all novels
  let todayMap = new Map<string, number>();
  if (novels.length > 0) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLogs = await prisma.writingLog.findMany({
        where: {
          novelId: { in: novels.map((n) => n.id) },
          date: today,
        },
      });
      todayMap = new Map(todayLogs.map((l) => [l.novelId, l.wordCount]));
    } catch (e) {
      console.error("Failed to fetch writing logs:", e);
      // Non-critical, continue without today's stats
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-wide">星图写作</h1>
          <p className="text-sm text-muted-foreground mt-1">长篇智能创作引擎</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/workspace/star/analytics"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-card-border hover:border-[var(--cyan)] transition-colors"
          >
            <BarChart3 size={16} /> 写作分析
          </Link>
          <ImportButton type="novel" accept=".txt,.epub" />
          <Link
            href="/workspace/star/create"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            <Plus size={16} /> 新建小说
          </Link>
        </div>
      </div>

      {fetchError && (
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-400">
          {fetchError}
        </div>
      )}

      {!session ? (
        <div className="space-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">请先登录</p>
        </div>
      ) : novels.length === 0 ? (
        <div className="space-card rounded-2xl p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">还没有开始创作</p>
          <p className="text-sm text-muted-foreground mb-6">点击「新建小说」开启引导式创书之旅</p>
          <Link
            href="/workspace/star/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            <Plus size={16} /> 创建第一本书
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {novels.map((novel) => {
            const totalWords = novel.chapters.reduce((sum: number, ch: { wordCount: number }) => sum + ch.wordCount, 0);
            const genre = genrePresets.find((g) => g.id === novel.genre);
            const progress = novel.targetWordCount ? Math.min(100, Math.round((totalWords / novel.targetWordCount) * 100)) : 0;
            const todayWords = todayMap.get(novel.id) || 0;

            return (
              <div key={novel.id} className="space-card group rounded-xl p-5 hover:border-[var(--cyan)] transition-all">
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/workspace/star/${novel.id}`} className="flex-1 min-w-0">
                    <h3 className="font-mono font-bold text-lg group-hover:text-[var(--cyan)] transition-colors truncate">
                      {novel.title}
                    </h3>
                    {novel.synopsis && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{novel.synopsis}</p>
                    )}
                  </Link>
                  <form action={deleteNovel.bind(null, novel.id)}>
                    <button className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {genre && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${genre.coverColor}15`, color: genre.coverColor }}>
                      {genre.label}
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground bg-[var(--accent)]">
                    {statusLabels[novel.status] || novel.status}
                  </span>
                </div>

                {/* Today's progress */}
                <div className="flex items-center gap-2 mb-3 text-[11px]">
                  <Target size={11} className="text-[var(--cyan)]" />
                  <span className="text-muted-foreground">今日</span>
                  <span className="font-medium text-foreground">{todayWords.toLocaleString()}</span>
                  <span className="text-muted-foreground">/ {novel.dailyWordTarget.toLocaleString()} 字</span>
                  <span className="text-[10px] text-[var(--cyan)]">
                    ({Math.round((todayWords / novel.dailyWordTarget) * 100)}%)
                  </span>
                </div>

                {/* Progress bar */}
                {novel.targetWordCount && totalWords > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>总进度</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-[var(--accent)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(2, progress)}%`, background: "var(--cyan)" }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{novel._count.chapters} 章</span>
                  <span>{totalWords.toLocaleString()} 字</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {novel.updatedAt.toLocaleDateString("zh-CN")}</span>
                </div>

                <Link
                  href={`/workspace/star/${novel.id}`}
                  className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-[var(--cyan)] hover:underline"
                >
                  {novel.chapters.length > 0 ? <Edit3 size={12} /> : <Plus size={12} />}
                  {novel.chapters.length > 0 ? "继续写作 →" : "开始写作 →"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
