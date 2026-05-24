import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Plus, Trash2, BookOpen, Globe, Users, ListTree, Download, GitGraph } from "lucide-react";
import NovelEditor from "@/components/star/NovelEditor";
import ChapterList from "@/components/star/ChapterList";
import WritingDashboard from "@/components/star/WritingDashboard";

const tabs = [
  { id: "chapters", label: "章节", icon: BookOpen, href: "" },
  { id: "settings", label: "设定", icon: Globe, href: "/settings" },
  { id: "characters", label: "角色", icon: Users, href: "/characters" },
  { id: "outline", label: "大纲", icon: ListTree, href: "/outline" },
  { id: "graph", label: "关系图", icon: GitGraph, href: "/graph" },
];

export default async function NovelEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: { chapters: { orderBy: { order: "asc" }, include: { outline: { select: { id: true, summary: true } } } } },
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
      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/workspace/star" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
            返回
          </Link>
          <h2 className="font-mono text-lg font-bold">{novel.title}</h2>
          <div className="flex items-center gap-1 ml-2">
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
      </div>
    </div>
  );
}
