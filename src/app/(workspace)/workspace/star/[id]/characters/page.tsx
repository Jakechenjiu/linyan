import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import CharacterCard from "@/components/star/CharacterCard";

export default async function NovelCharactersPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: { characters: { orderBy: { sortOrder: "asc" } } },
  });
  if (!novel || novel.userId !== session.user.id) notFound();

  async function addCharacter(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) return;
    const name = formData.get("name") as string;
    if (!name?.trim()) return;
    const role = (formData.get("role") as string) || "supporting";
    const maxOrder = novel!.characters.reduce((m, c) => Math.max(m, c.sortOrder), 0);
    await prisma.character.create({
      data: { novelId: novel!.id, name: name.trim(), role, sortOrder: maxOrder + 1 },
    });
    revalidatePath(`/workspace/star/${novel!.id}/characters`);
  }

  async function deleteCharacter(cid: string) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) return;
    await prisma.character.deleteMany({
      where: { id: cid, novel: { userId: s.user.id } },
    });
    revalidatePath(`/workspace/star/${novel!.id}/characters`);
  }

  async function saveCharacter(cid: string, data: Record<string, string | null>) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) return;
    await prisma.character.updateMany({
      where: { id: cid, novel: { userId: s.user.id } },
      data,
    });
    revalidatePath(`/workspace/star/${novel!.id}/characters`);
  }

  const roleLabels: Record<string, { label: string; color: string }> = {
    protagonist: { label: "主角", color: "var(--cyan)" },
    antagonist: { label: "反派", color: "#ef4444" },
    love_interest: { label: "感情线", color: "#ec4899" },
    mentor: { label: "导师", color: "#f0e68c" },
    supporting: { label: "配角", color: "" },
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={`/workspace/star/${novel.id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
          <ArrowLeft size={14} /> 返回工作室
        </Link>
      </div>

      <div>
        <h1 className="font-mono text-2xl font-bold tracking-wide">角色设计</h1>
        <p className="text-sm text-muted-foreground mt-1">{novel.title}</p>
      </div>

      {/* Character list */}
      <div className="space-y-4">
        {novel.characters.length === 0 ? (
          <div className="space-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
            还没有创建角色，使用下方表单添加
          </div>
        ) : (
          novel.characters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              onSave={saveCharacter}
              onDelete={deleteCharacter}
            />
          ))
        )}
      </div>

      {/* Add character form */}
      <form action={addCharacter} className="space-card rounded-xl p-4 flex items-center gap-3">
        <input name="name" placeholder="新角色姓名…"
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
        />
        <select name="role" defaultValue="supporting"
          className="px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-sm focus:outline-none"
        >
          {Object.entries(roleLabels).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button type="submit"
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
          style={{ color: "#0a0e17" }}
        >
          <Plus size={14} /> 添加
        </button>
      </form>
    </div>
  );
}
