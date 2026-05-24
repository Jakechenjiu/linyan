import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, BookOpen, BarChart3, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";

async function deleteNovel(id: string) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.novel.deleteMany({ where: { id, userId: session.user.id } });
  revalidatePath("/workspace/star");
}

export default async function StarPage() {
  const session = await auth();
  const novels = await prisma.novel.findMany({
    where: { userId: session?.user?.id },
    include: { _count: { select: { chapters: true } }, chapters: { select: { wordCount: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-wide">星图写作</h1>
          <p className="text-sm text-muted-foreground mt-1">长篇智能创作引擎</p>
        </div>
        <Link
          href="/workspace/star/analytics"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-card-border hover:border-[var(--cyan)] transition-colors"
        >
          <BarChart3 size={16} /> 写作分析
        </Link>
      </div>

      {novels.length === 0 ? (
        <div className="space-card rounded-2xl p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">还没有开始创作</p>
          <p className="text-sm text-muted-foreground mb-6">创建你的第一部长篇小说</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {novels.map((novel) => {
            const totalWords = novel.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
            return (
              <div key={novel.id} className="space-card group rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/workspace/star/${novel.id}`} className="flex-1">
                    <h3 className="font-mono font-bold text-lg group-hover:text-[var(--cyan)] transition-colors">
                      {novel.title}
                    </h3>
                  </Link>
                  <form action={deleteNovel.bind(null, novel.id)}>
                    <button className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{novel._count.chapters} 章</span>
                  <span>{totalWords.toLocaleString()} 字</span>
                  <span>更新于 {novel.updatedAt.toLocaleDateString("zh-CN")}</span>
                </div>
                <Link
                  href={`/workspace/star/${novel.id}`}
                  className="inline-block mt-3 text-xs font-medium text-[var(--cyan)] hover:underline"
                >
                  继续写作 →
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Create novel form */}
      <form
        action={async (formData: FormData) => {
          "use server";
          const session = await auth();
          if (!session?.user?.id) return;
          const title = formData.get("title") as string;
          if (!title?.trim()) return;
          await prisma.novel.create({
            data: { title: title.trim(), userId: session.user.id },
          });
          revalidatePath("/workspace/star");
        }}
        className="space-card rounded-2xl p-6"
      >
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <Plus size={20} className="text-[var(--cyan)]" />
          新建小说
        </h2>
        <div className="flex gap-3">
          <input
            name="title"
            placeholder="输入小说标题…"
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            创建
          </button>
        </div>
      </form>
    </div>
  );
}
