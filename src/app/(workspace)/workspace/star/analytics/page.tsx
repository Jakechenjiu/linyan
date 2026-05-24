import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BarChart3, TrendingUp, BookOpen, FileText } from "lucide-react";

export default async function StarAnalyticsPage() {
  const session = await auth();
  const novels = await prisma.novel.findMany({
    where: { userId: session?.user?.id },
    include: { chapters: { select: { wordCount: true, createdAt: true } } },
  });

  const totalWords = novels.reduce(
    (sum, n) => sum + n.chapters.reduce((s, ch) => s + ch.wordCount, 0),
    0
  );
  const totalChapters = novels.reduce((sum, n) => sum + n.chapters.length, 0);
  const avgChapterLen = totalChapters > 0 ? Math.round(totalWords / totalChapters) : 0;

  // Weekly trend (30 days)
  const now = Date.now();
  const days: { label: string; words: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, words: 0 });
  }
  for (const n of novels) {
    for (const ch of n.chapters) {
      const idx = days.findIndex(
        (d) => d.label === `${ch.createdAt.getMonth() + 1}/${ch.createdAt.getDate()}`
      );
      if (idx >= 0) days[idx].words += ch.wordCount;
    }
  }
  const maxWords = Math.max(1, ...days.map((d) => d.words));

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">写作分析</h1>
        <p className="text-sm text-muted-foreground mt-1">追踪你的创作数据</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "总字数", value: totalWords.toLocaleString(), icon: <FileText size={20} />, color: "var(--cyan)" },
          { label: "总章节", value: String(totalChapters), icon: <BookOpen size={20} />, color: "var(--nebula)" },
          { label: "平均章节字数", value: avgChapterLen.toLocaleString(), icon: <TrendingUp size={20} />, color: "var(--star)" },
        ].map((stat) => (
          <div key={stat.label} className="space-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>
              {stat.icon}
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="font-mono text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="space-card rounded-2xl p-6">
        <h2 className="font-mono text-lg font-bold mb-6 flex items-center gap-2">
          <BarChart3 size={20} className="text-[var(--cyan)]" />
          每日写作量 (近30天)
        </h2>
        <div className="flex items-end gap-1 h-40">
          {days.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[9px] text-muted-foreground">
                {d.words > 0 ? d.words.toLocaleString() : ""}
              </span>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(2, (d.words / maxWords) * 100)}%`,
                  background: d.words > 0 ? "var(--cyan)" : "var(--accent)",
                  opacity: d.words > 0 ? 0.8 : 0.3,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-muted-foreground">
          <span>30天前</span>
          <span>今天</span>
        </div>
      </div>
    </div>
  );
}
