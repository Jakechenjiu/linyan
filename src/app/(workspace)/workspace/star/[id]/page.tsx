import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Download, Plus, Trash2, GripVertical } from "lucide-react";
import StarTabs from "@/components/star/StarTabs";
import StarEditorLayout from "@/components/star/StarEditorLayout";

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
      characters: { orderBy: { sortOrder: "asc" } },
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

  async function saveChapter(chapterId: string, title: string, body: string) {
    "use server";
    const wordCount = body.replace(/\s/g, "").length;
    await prisma.chapter.updateMany({
      where: { id: chapterId, novel: { userId: session!.user!.id } },
      data: { title, body, wordCount },
    });
    revalidatePath(`/workspace/star/${novel!.id}`);
  }

  // Serialize data for client components
  const chaptersData = novel.chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    body: ch.body,
    wordCount: ch.wordCount,
    order: ch.order,
    factSnapshot: ch.factSnapshot,
    outline: ch.outline,
  }));

  const charactersData = novel.characters.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    tagline: c.tagline,
    personality: c.personality,
  }));

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
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-card-border shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/workspace/star" className="text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
            返回
          </Link>
          <h2 className="font-mono text-base font-bold">{novel.title}</h2>
          <span className="text-xs text-muted-foreground">{totalWords.toLocaleString()} 字</span>
          <StarTabs novelId={novel.id} />
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/novels/${novel.id}/export`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all"
          >
            <Download size={12} /> 导出
          </a>
        </div>
      </div>

      {/* Main layout */}
      <StarEditorLayout
        novelId={novel.id}
        chapters={chaptersData}
        characters={charactersData}
        outlineVolumes={outlineVolumes}
        addAction={addChapter}
        deleteAction={deleteChapter}
        saveAction={saveChapter}
      />
    </div>
  );
}
