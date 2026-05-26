import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import CodexEntryCard from "@/components/star/CodexEntryCard";

export default async function CodexPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: { codexEntries: { orderBy: { sortOrder: "asc" } } },
  });
  if (!novel || novel.userId !== session.user.id) notFound();

  async function addEntry(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    if (!name?.trim()) return;
    const type = (formData.get("type") as string) || "custom";
    const maxOrder = novel!.codexEntries.reduce((m, e) => Math.max(m, e.sortOrder), 0);
    await prisma.codexEntry.create({
      data: { novelId: novel!.id, name: name.trim(), type, sortOrder: maxOrder + 1 },
    });
    revalidatePath(`/workspace/star/${novel!.id}/codex`);
  }

  async function saveEntry(id: string, formData: FormData) {
    "use server";
    const name = (formData.get("name") as string) || "";
    const type = (formData.get("type") as string) || "custom";
    const summary = (formData.get("summary") as string) || null;
    const body = (formData.get("body") as string) || null;
    const keywords = (formData.get("keywords") as string) || "[]";
    await prisma.codexEntry.updateMany({
      where: { id, novel: { userId: session!.user!.id } },
      data: { name: name.trim(), type, summary, body, keywords },
    });
    revalidatePath(`/workspace/star/${novel!.id}/codex`);
  }

  async function deleteEntry(id: string) {
    "use server";
    await prisma.codexEntry.deleteMany({
      where: { id, novel: { userId: session!.user!.id } },
    });
    revalidatePath(`/workspace/star/${novel!.id}/codex`);
  }

  const typeGroups = {
    location: novel.codexEntries.filter((e) => e.type === "location"),
    faction: novel.codexEntries.filter((e) => e.type === "faction"),
    event: novel.codexEntries.filter((e) => e.type === "event"),
    item: novel.codexEntries.filter((e) => e.type === "item"),
    creature: novel.codexEntries.filter((e) => e.type === "creature"),
    world_rule: novel.codexEntries.filter((e) => e.type === "world_rule"),
    custom: novel.codexEntries.filter((e) => e.type === "custom"),
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={`/workspace/star/${novel.id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
          <ArrowLeft size={14} /> 返回工作室
        </Link>
      </div>

      <div>
        <h1 className="font-mono text-2xl font-bold tracking-wide">素材库</h1>
        <p className="text-sm text-muted-foreground mt-1">{novel.title} · {novel.codexEntries.length} 条素材</p>
      </div>

      {/* Add entry */}
      <form action={addEntry} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--accent)] border border-card-border">
        <input name="name" placeholder="新素材名称…"
          className="flex-1 px-3 py-2 rounded-lg bg-transparent border border-card-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
        />
        <select name="type"
          className="px-3 py-2 rounded-lg bg-transparent border border-card-border text-foreground text-sm focus:outline-none focus:border-[var(--cyan)]"
        >
          <option value="custom">自定义</option>
          <option value="location">地点</option>
          <option value="faction">势力</option>
          <option value="event">事件</option>
          <option value="item">物品</option>
          <option value="creature">生物</option>
          <option value="world_rule">世界规则</option>
        </select>
        <button type="submit"
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
          style={{ color: "#0a0e17" }}
        >
          <Plus size={14} /> 添加
        </button>
      </form>

      {/* Entries grouped by type */}
      {novel.codexEntries.length === 0 ? (
        <div className="space-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
          还没有素材，使用上方表单添加第一条
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(typeGroups).map(([type, entries]) => {
            if (entries.length === 0) return null;
            const typeLabel: Record<string, string> = {
              location: "地点", faction: "势力", event: "事件",
              item: "物品", creature: "生物", world_rule: "世界规则", custom: "自定义",
            };
            return (
              <div key={type}>
                <h3 className="text-xs font-medium text-muted-foreground mb-2">{typeLabel[type]} ({entries.length})</h3>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <CodexEntryCard
                      key={entry.id}
                      entry={entry}
                      saveAction={saveEntry}
                      deleteAction={deleteEntry}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
