import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";

const relTypes: Record<string, { label: string; color: string }> = {
  ally: { label: "盟友", color: "#00e5ff" },
  enemy: { label: "敌人", color: "#ef4444" },
  lover: { label: "爱慕", color: "#ec4899" },
  family: { label: "亲属", color: "#f0e68c" },
  master_student: { label: "师徒", color: "#7c3aed" },
  rival: { label: "竞争对手", color: "#f59e0b" },
};

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
    const session = await auth();
    if (!session?.user?.id) return;
    const name = formData.get("name") as string;
    if (!name?.trim()) return;
    const role = (formData.get("role") as string) || "supporting";
    const maxOrder = novel!.characters.reduce((m, c) => Math.max(m, c.sortOrder), 0);
    await prisma.character.create({
      data: {
        novelId: novel!.id,
        name: name.trim(),
        role,
        sortOrder: maxOrder + 1,
      },
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

  async function saveCharacter(cid: string, formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) return;
    const data: Record<string, string | null> = {};
    for (const key of ["name", "tagline", "role", "appearance", "personality", "desire", "flaw", "wound", "need", "change", "goldenFinger", "relationships"]) {
      data[key] = (formData.get(key) as string) || null;
    }
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-wide">角色设计</h1>
          <p className="text-sm text-muted-foreground mt-1">{novel.title}</p>
        </div>
      </div>

      {/* Character list */}
      <div className="space-y-4">
        {novel.characters.length === 0 ? (
          <div className="space-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
            还没有创建角色，使用下方表单添加
          </div>
        ) : (
          novel.characters.map((char) => {
            let relationships: { characterId: string; type: string; label: string }[] = [];
            try { relationships = JSON.parse(char.relationships || "[]"); } catch {}

            return (
              <div key={char.id} className="space-card rounded-xl p-5">
                <form action={saveCharacter.bind(null, char.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input name="name" defaultValue={char.name}
                        className="font-mono font-bold text-lg bg-transparent border-0 text-foreground focus:outline-none focus:border-b focus:border-[var(--cyan)] w-32"
                      />
                      <select name="role" defaultValue={char.role}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)] border-0 text-muted-foreground"
                      >
                        {Object.entries(roleLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="submit" className="text-xs text-[var(--cyan)] hover:underline flex items-center gap-1">
                        <Save size={12} /> 保存
                      </button>
                      <form action={deleteCharacter.bind(null, char.id)}>
                        <button type="submit" className="text-xs text-muted-foreground hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "tagline", label: "称号", placeholder: "如：废柴少年 / 重生仙尊" },
                      { key: "desire", label: "Desire 欲望", placeholder: "外在驱动力" },
                      { key: "flaw", label: "Flaw 缺陷", placeholder: "致命的性格弱点" },
                      { key: "wound", label: "Wound 创伤", placeholder: "过去的伤痛" },
                      { key: "need", label: "Need 内在需求", placeholder: "真正需要的" },
                      { key: "change", label: "Change 成长", placeholder: "心态变化轨迹" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-[10px] text-muted-foreground mb-0.5 block">
                          {key === "desire" ? <span style={{ color: "var(--cyan)" }}>{label}</span> :
                           key === "flaw" ? <span style={{ color: "#ef4444" }}>{label}</span> : label}
                        </label>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <input name={key} defaultValue={(char as any)[key] || ""} placeholder={placeholder}
                          className="w-full px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
                        />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground mb-0.5 block">
                        <span style={{ color: "#f0e68c" }}>Golden Finger 金手指</span>
                      </label>
                      <input name="goldenFinger" defaultValue={char.goldenFinger || ""} placeholder="特殊的优势或能力"
                        className="w-full px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground mb-0.5 block">性格</label>
                      <textarea name="personality" defaultValue={char.personality || ""} rows={2} placeholder="显性性格 + 隐性性格"
                        className="w-full px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors resize-y"
                      />
                    </div>
                  </div>

                  {/* Relationships section */}
                  <div className="mt-4 pt-3 border-t border-card-border">
                    <p className="text-[10px] text-muted-foreground mb-2">角色关系</p>
                    {relationships.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground/50">暂无关系设定</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {relationships.map((rel, ri) => {
                          const target = novel.characters.find((c) => c.id === rel.characterId);
                          const rt = relTypes[rel.type] || relTypes.ally;
                          return (
                            <span key={ri} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: `${rt.color}15`, color: rt.color }}>
                              {rt.label}: {target?.name || "?"}{rel.label ? ` (${rel.label})` : ""}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {/* Hidden field to persist current relationships */}
                    <input type="hidden" name="relationships" value={char.relationships || "[]"} />
                    {/* Note: Relationship editing available in graph view */}
                  </div>
                </form>
              </div>
            );
          })
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
