import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Plus, Trash2, BookOpen, Globe, Users, ListTree } from "lucide-react";
import NovelEditor from "@/components/star/NovelEditor";

const tabs = [
  { id: "chapters", label: "章节", icon: BookOpen, href: "" },
  { id: "settings", label: "设定", icon: Globe, href: "/settings" },
  { id: "characters", label: "角色", icon: Users, href: "/characters" },
  { id: "outline", label: "大纲", icon: ListTree, href: "/outline" },
];

export default async function NovelEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
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
      data: { title: title.trim(), body: "", order: maxOrder + 1, novelId: novel!.id },
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

  return (
    <div className="space-y-4 h-[calc(100vh-5rem)] max-w-6xl flex flex-col">
      {/* Tab navigation */}
      <div className="flex items-center gap-4 shrink-0">
        <Link href="/workspace/star" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
          返回
        </Link>
        <h2 className="font-mono text-lg font-bold">{novel.title}</h2>
        <div className="flex items-center gap-1 ml-4">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/workspace/star/${novel.id}${tab.href}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab.id === "chapters"
                  ? "bg-[var(--cyan)] text-[#0a0e17]"
                  : "text-muted-foreground hover:text-foreground hover:bg-[var(--accent)]"
              }`}
            >
              <tab.icon size={13} /> {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Chapter sidebar */}
        <div className="w-64 shrink-0 space-y-3 overflow-y-auto pr-2">
          <p className="text-xs text-muted-foreground">
            {novel.chapters.length} 章 · {totalWords.toLocaleString()} 字
          </p>

          <form action={addChapter} className="space-card rounded-xl p-3">
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

          <div className="space-y-1">
            {novel.chapters.map((ch) => (
              <div key={ch.id} className="space-card rounded-lg p-3 group">
                <div className="flex items-start justify-between gap-2">
                  <a href={`#chapter-${ch.id}`} className="flex-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground">第 {ch.order} 章</span>
                    <p className="text-xs font-medium truncate">{ch.title}</p>
                    <span className="text-[10px] text-muted-foreground">{ch.wordCount} 字</span>
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
                <div key={ch.id} id={`chapter-${ch.id}`}>
                  <NovelEditor novelId={novel.id} chapter={ch} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
