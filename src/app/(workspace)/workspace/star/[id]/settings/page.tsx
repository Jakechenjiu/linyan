import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default async function NovelSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: { worldSetting: true },
  });
  if (!novel || novel.userId !== session.user.id) notFound();

  async function saveSettings(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;

    const data = {
      worldType: (formData.get("worldType") as string) || null,
      scale: (formData.get("scale") as string) || null,
      powerSystem: (formData.get("powerSystem") as string) || null,
      geography: (formData.get("geography") as string) || null,
      factions: (formData.get("factions") as string) || null,
      rules: (formData.get("rules") as string) || null,
    };

    if (novel!.worldSetting) {
      await prisma.worldSetting.updateMany({
        where: { novelId: novel!.id },
        data,
      });
    } else {
      await prisma.worldSetting.create({
        data: { ...data, novelId: novel!.id },
      });
    }
    revalidatePath(`/workspace/star/${novel!.id}/settings`);
  }

  const ws = novel.worldSetting;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={`/workspace/star/${novel.id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
          <ArrowLeft size={14} /> 返回工作室
        </Link>
      </div>

      <div>
        <h1 className="font-mono text-2xl font-bold tracking-wide">世界观设定</h1>
        <p className="text-sm text-muted-foreground mt-1">{novel.title}</p>
      </div>

      <form
        action={saveSettings}
        className="space-card rounded-2xl p-6 space-y-5"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">世界类型</label>
            <select name="worldType" defaultValue={ws?.worldType || ""}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-sm focus:outline-none focus:border-[var(--cyan)]"
            >
              <option value="">不指定</option>
              <option value="cultivation">修炼文明</option>
              <option value="cyberpunk">赛博朋克</option>
              <option value="cthulhu">克苏鲁</option>
              <option value="wasteland">废土末世</option>
              <option value="modern">现代都市</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">世界规模</label>
            <select name="scale" defaultValue={ws?.scale || ""}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-sm focus:outline-none focus:border-[var(--cyan)]"
            >
              <option value="">不指定</option>
              <option value="single_city">单城</option>
              <option value="multi_region">多区域</option>
              <option value="continent">大陆级</option>
              <option value="multi_realm">多界域</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">力量体系</label>
          <textarea name="powerSystem" defaultValue={ws?.powerSystem || ""} rows={8}
            placeholder="描述修炼/能力体系，包括等级划分、资源获取、代价与限制…"
            className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm font-mono resize-y"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">地理架构</label>
          <textarea name="geography" defaultValue={ws?.geography || ""} rows={4}
            placeholder="世界的地理分布、核心区域、禁区…"
            className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm font-mono resize-y"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">势力格局</label>
          <textarea name="factions" defaultValue={ws?.factions || ""} rows={4}
            placeholder="谁掌控着这个世界？有哪些对立势力？"
            className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm font-mono resize-y"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">世界铁律</label>
          <textarea name="rules" defaultValue={ws?.rules || ""} rows={4}
            placeholder="这个世界不可打破的规则…"
            className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm font-mono resize-y"
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-card-border">
          <button type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            <Save size={14} /> 保存设定
          </button>
        </div>
      </form>
    </div>
  );
}
