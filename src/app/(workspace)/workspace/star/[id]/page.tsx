import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Sparkles, Trash2 } from "lucide-react";

export default async function NovelEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const novel = await prisma.novel.findUnique({
    where: { id: (await params).id },
    include: { chapters: { orderBy: { order: "asc" } } },
  });
  if (!novel || novel.userId !== session.user.id) notFound();

  const totalWords = novel.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  async function addChapter(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    if (!title?.trim()) return;
    const maxOrder = novel!.chapters.reduce((m, ch) => Math.max(m, ch.order), 0);
    await prisma.chapter.create({
      data: {
        title: title.trim(),
        body: "",
        order: maxOrder + 1,
        novelId: novel!.id,
      },
    });
    revalidatePath(`/workspace/star/${novel!.id}`);
  }

  async function deleteChapter(chapterId: string) {
    "use server";
    await prisma.chapter.deleteMany({
      where: { id: chapterId, novel: { userId: session!.user!.id } },
    });
    revalidatePath(`/workspace/star/${novel!.id}`);
  }

  async function saveChapter(chapterId: string, formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;
    const wordCount = body.trim().length;
    await prisma.chapter.updateMany({
      where: { id: chapterId, novel: { userId: session!.user!.id } },
      data: { title: title?.trim(), body, wordCount },
    });
    revalidatePath(`/workspace/star/${novel!.id}`);
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)] max-w-6xl">
      {/* Chapter sidebar */}
      <div className="w-64 shrink-0 space-y-3 overflow-y-auto pr-2">
        <Link
          href="/workspace/star"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors"
        >
          <ArrowLeft size={14} /> 返回列表
        </Link>
        <h2 className="font-mono text-lg font-bold">{novel.title}</h2>
        <p className="text-xs text-muted-foreground">
          {novel.chapters.length} 章 · {totalWords.toLocaleString()} 字
        </p>

        {/* Add chapter */}
        <form
          action={addChapter}
          className="space-card rounded-xl p-3"
        >
          <input
            name="title"
            placeholder="新章节标题…"
            className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-xs focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
          <button
            type="submit"
            className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all"
          >
            <Plus size={12} /> 添加章节
          </button>
        </form>

        {/* Chapter list */}
        <div className="space-y-1">
          {novel.chapters.map((ch) => (
            <div
              key={ch.id}
              className="space-card rounded-lg p-3 group"
            >
              <div className="flex items-start justify-between gap-2">
                <a
                  href={`#chapter-${ch.id}`}
                  className="flex-1 min-w-0"
                >
                  <span className="text-[10px] text-muted-foreground">
                    第 {ch.order} 章
                  </span>
                  <p className="text-xs font-medium truncate">{ch.title}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {ch.wordCount} 字
                  </span>
                </a>
                <form action={deleteChapter.bind(null, ch.id)}>
                  <button className="p-0.5 rounded text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={12} />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        {novel.chapters.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            选择或创建一个章节开始写作
          </div>
        ) : (
          <div className="space-y-8">
            {novel.chapters.map((ch) => (
              <div key={ch.id} id={`chapter-${ch.id}`} className="space-card rounded-2xl p-6">
                <form action={saveChapter.bind(null, ch.id)}>
                  <input
                    name="title"
                    defaultValue={ch.title}
                    className="w-full font-mono text-xl font-bold bg-transparent border-b border-card-border pb-2 mb-4 focus:outline-none focus:border-[var(--cyan)] transition-colors"
                  />
                  <textarea
                    name="body"
                    defaultValue={ch.body}
                    rows={Math.max(8, ch.body.split("\n").length + 4)}
                    className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
                    placeholder="开始写作…"
                  />
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-card-border">
                    <span className="text-xs text-muted-foreground">
                      {ch.wordCount.toLocaleString()} 字
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border hover:border-[var(--nebula)] text-[var(--nebula)] transition-colors"
                      >
                        <Sparkles size={12} /> AI 续写
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all"
                      >
                        <Save size={12} /> 保存
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
