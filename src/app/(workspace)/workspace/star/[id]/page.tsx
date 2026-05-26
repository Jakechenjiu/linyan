import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Download } from "lucide-react";
import NovelEditor from "@/components/star/NovelEditor";
import ChapterList from "@/components/star/ChapterList";
import WritingDashboard from "@/components/star/WritingDashboard";
import StarTabs from "@/components/star/StarTabs";

export default async function NovelEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: { outline: { select: { id: true, summary: true } } },
      },
      outlines: {
        orderBy: { sortOrder: "asc" },
        include: { children: { orderBy: { sortOrder: "asc" }, include: { chapters: true } } },
      },
    },
  });
  if (!novel || novel.userId !== session.user.id) notFound();

  const totalWords = novel.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  async function addChapter(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    if (!title?.trim()) return { ok: false, error: "标题不能为空" };

    const afterChapterId = formData.get("afterChapterId") as string | null;

    if (afterChapterId) {
      // Insert after specific chapter
      const afterChapter = novel!.chapters.find((ch) => ch.id === afterChapterId);
      if (afterChapter) {
        await prisma.$transaction([
          prisma.chapter.updateMany({
            where: { novelId: novel!.id, order: { gt: afterChapter.order } },
            data: { order: { increment: 1 } },
          }),
          prisma.chapter.create({
            data: { title: title.trim(), body: "", order: afterChapter.order + 1, novelId: novel!.id },
          }),
        ]);
        revalidatePath(`/workspace/star/${novel!.id}`);
        return { ok: true, title: title.trim() };
      }
    }

    // Default: append at end
    const maxOrder = novel!.chapters.reduce((m, ch) => Math.max(m, ch.order), 0);
    await prisma.chapter.create({
      data: { title: title.trim(), body: "", order: maxOrder + 1, novelId: novel!.id },
    });
    revalidatePath(`/workspace/star/${novel!.id}`);
    return { ok: true, title: title.trim() };
  }

  async function deleteChapter(chapterId: string) {
    "use server";
    await prisma.chapter.deleteMany({
      where: { id: chapterId, novel: { userId: session!.user!.id } },
    });
    revalidatePath(`/workspace/star/${novel!.id}`);
  }

  // Build outline tree for sidebar
  const outlineVolumes = novel.outlines
    .filter((o) => o.type === "volume" && !o.parentId)
    .map((vol) => ({
      id: vol.id,
      title: vol.title,
      summary: vol.summary,
      children: novel.outlines
        .filter((o) => o.parentId === vol.id)
        .map((ch) => ({
          id: ch.id,
          title: ch.title,
          summary: ch.summary,
          chapterId: (ch as any).chapters?.[0]?.id || null,
        })),
    }));

  return (
    <div className="space-y-4 h-[calc(100vh-5rem)] max-w-7xl flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/workspace/star" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
            返回
          </Link>
          <h2 className="font-mono text-lg font-bold">{novel.title}</h2>
          <StarTabs novelId={novel.id} />
        </div>
        <a
          href={`/api/novels/${novel.id}/export`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all"
        >
          <Download size={13} /> 导出 TXT
        </a>
      </div>

      {/* Writing Dashboard */}
      <WritingDashboard novelId={novel.id} />

      {/* Content area */}
      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Chapter sidebar with drag-and-drop */}
        <ChapterList
          novelId={novel.id}
          chapters={novel.chapters}
          totalWords={totalWords}
          addAction={addChapter}
          deleteAction={deleteChapter}
        />

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

        {/* Outline sidebar */}
        {outlineVolumes.length > 0 && (
          <div className="w-56 shrink-0 overflow-y-auto hidden xl:block">
            <p className="text-xs font-medium text-muted-foreground mb-2">大纲</p>
            <div className="space-y-2">
              {outlineVolumes.map((vol) => (
                <div key={vol.id} className="space-card rounded-lg p-2">
                  <p className="text-[11px] font-bold text-[var(--cyan)] truncate">{vol.title}</p>
                  {vol.children.length > 0 && (
                    <div className="ml-2 mt-1 space-y-0.5">
                      {vol.children.map((ch) => (
                        <div key={ch.id} className="flex items-center gap-1">
                          {ch.chapterId ? (
                            <a
                              href={`#chapter-${ch.chapterId}`}
                              className="text-[10px] text-muted-foreground hover:text-[var(--cyan)] truncate transition-colors"
                            >
                              {ch.title}
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50 truncate">{ch.title}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
