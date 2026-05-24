import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Plus, Trash2, Save, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function NovelOutlinePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      outlines: {
        orderBy: { sortOrder: "asc" },
        include: { children: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!novel || novel.userId !== session.user.id) notFound();

  // Separate volume-level and chapter-level nodes
  const volumes = novel.outlines.filter((o) => o.type === "volume" && !o.parentId);

  async function addVolume(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    if (!title?.trim()) return;
    const maxOrder = novel!.outlines.filter((o) => o.type === "volume").reduce((m, o) => Math.max(m, o.sortOrder), 0);
    await prisma.outline.create({
      data: { novelId: novel!.id, title: title.trim(), type: "volume", sortOrder: maxOrder + 1 },
    });
    revalidatePath(`/workspace/star/${novel!.id}/outline`);
  }

  async function addChapter(parentId: string, formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    if (!title?.trim()) return;
    const siblings = novel!.outlines.filter((o) => o.parentId === parentId);
    const maxOrder = siblings.reduce((m, o) => Math.max(m, o.sortOrder), 0);
    await prisma.outline.create({
      data: { novelId: novel!.id, parentId, title: title.trim(), type: "chapter", sortOrder: maxOrder + 1 },
    });
    revalidatePath(`/workspace/star/${novel!.id}/outline`);
  }

  async function deleteNode(oid: string) {
    "use server";
    await prisma.outline.deleteMany({ where: { id: oid, novel: { userId: session!.user!.id } } });
    revalidatePath(`/workspace/star/${novel!.id}/outline`);
  }

  async function saveNode(oid: string, formData: FormData) {
    "use server";
    const title = (formData.get("title") as string) || "";
    const summary = (formData.get("summary") as string) || null;
    const nodes = (formData.get("nodes") as string) || null;
    const wordTarget = formData.get("wordTarget") ? Number(formData.get("wordTarget")) : null;
    await prisma.outline.updateMany({
      where: { id: oid, novel: { userId: session!.user!.id } },
      data: { title: title.trim(), summary, nodes, wordTarget },
    });
    revalidatePath(`/workspace/star/${novel!.id}/outline`);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={`/workspace/star/${novel.id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
          <ArrowLeft size={14} /> 返回工作室
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-wide">大纲规划</h1>
          <p className="text-sm text-muted-foreground mt-1">{novel.title}</p>
        </div>
      </div>

      {/* Add volume */}
      <form action={addVolume} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--accent)] border border-card-border">
        <input name="title" placeholder="新卷标题…"
          className="flex-1 px-3 py-2 rounded-lg bg-transparent border border-card-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
        />
        <button type="submit"
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
          style={{ color: "#0a0e17" }}
        >
          <Plus size={14} /> 添加卷
        </button>
      </form>

      {/* Outline tree */}
      {volumes.length === 0 ? (
        <div className="space-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
          还没有创建大纲，使用上方表单添加第一个卷
        </div>
      ) : (
        <div className="space-y-3">
          {volumes.map((vol) => {
            const chapters = novel.outlines.filter((o) => o.parentId === vol.id);
            return (
              <div key={vol.id} className="space-card rounded-xl p-4">
                <form action={saveNode.bind(null, vol.id)}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-[var(--cyan)] font-mono">◆</span>
                    <input name="title" defaultValue={vol.title}
                      className="font-mono font-bold text-base bg-transparent border-0 text-foreground focus:outline-none focus:border-b focus:border-[var(--cyan)] flex-1"
                    />
                    <input name="summary" defaultValue={vol.summary || ""} placeholder="本卷概要…"
                      className="w-32 px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)]"
                    />
                    <button type="submit" className="text-xs text-[var(--cyan)] hover:underline"><Save size={12} /></button>
                    <button type="button" onClick={async () => { "use server"; deleteNode(vol.id); }}
                      className="text-xs text-muted-foreground hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                </form>

                {/* Chapters under this volume */}
                {chapters.length > 0 && (
                  <div className="ml-4 space-y-1 border-l border-card-border pl-4">
                    {chapters.map((ch) => (
                      <div key={ch.id} className="flex items-center gap-2 py-1">
                        <span className="text-[10px] text-muted-foreground w-6">#{ch.sortOrder}</span>
                        <form action={saveNode.bind(null, ch.id)} className="flex items-center gap-2 flex-1">
                          <input name="title" defaultValue={ch.title}
                            className="flex-1 px-2 py-1 rounded bg-[var(--accent)] border border-card-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)]"
                          />
                          <input name="nodes" defaultValue={ch.nodes || ""} placeholder="CBN/CPNs/CEN JSON"
                            className="w-24 px-2 py-1 rounded bg-[var(--accent)] border border-card-border text-foreground text-[10px] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)]"
                          />
                          <input name="wordTarget" type="number" defaultValue={ch.wordTarget || ""} placeholder="字数"
                            className="w-14 px-1 py-1 rounded bg-[var(--accent)] border border-card-border text-foreground text-[10px] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)]"
                          />
                          <button type="submit" className="text-xs text-[var(--cyan)] hover:underline"><Save size={10} /></button>
                        </form>
                        <button type="button" onClick={async () => { "use server"; deleteNode(ch.id); }}
                          className="text-xs text-muted-foreground hover:text-red-400"><Trash2 size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add chapter to this volume */}
                <form action={addChapter.bind(null, vol.id)}
                  className="ml-4 mt-2 flex items-center gap-2">
                  <input name="title" placeholder="+ 添加章节…"
                    className="flex-1 px-2 py-1 rounded bg-transparent border border-dashed border-card-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
                  />
                  <button type="submit"
                    className="text-xs text-[var(--cyan)] hover:underline font-medium">添加</button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
