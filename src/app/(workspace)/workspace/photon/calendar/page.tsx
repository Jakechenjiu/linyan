import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Calendar as CalendarIcon, Plus } from "lucide-react";

export default async function CalendarPage() {
  let session;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (!session?.user?.id) redirect("/login");

  let entries: any[] = [];
  let fetchError: string | null = null;
  try {
    entries = await prisma.content.findMany({
      where: { userId: session.user.id, status: "scheduled" },
      orderBy: { updatedAt: "asc" },
    });
  } catch (e) {
    console.error("Failed to fetch calendar entries:", e);
    fetchError = "数据加载失败，请刷新页面重试。";
  }

  const scheduled = entries.filter((e) => e.status === "scheduled");

  async function addEntry(formData: FormData) {
    "use server";
    let s;
    try {
      s = await auth();
    } catch {
      return;
    }
    if (!s?.user?.id) return;
    const title = formData.get("title") as string;
    if (!title?.trim()) return;
    try {
      await prisma.content.create({
        data: {
          title: title.trim(),
          body: "",
          platform: "wechat",
          contentType: "article",
          wordCount: 0,
          status: "scheduled",
          userId: s.user.id,
        },
      });
    } catch (e) {
      console.error("Failed to create calendar entry:", e);
    }
    revalidatePath("/workspace/photon/calendar");
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide flex items-center gap-3">
          <CalendarIcon size={28} className="text-[var(--cyan)]" />
          内容日历
        </h1>
        <p className="text-sm text-muted-foreground mt-1">管理内容排期</p>
      </div>

      {fetchError && (
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-400">
          {fetchError}
        </div>
      )}

      {/* Add entry */}
      <form
        action={addEntry}
        className="space-card rounded-2xl p-6"
      >
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <Plus size={18} className="text-[var(--cyan)]" />
          新增排期
        </h2>
        <div className="flex gap-3">
          <input
            name="title"
            placeholder="内容标题…"
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
          <input
            name="date"
            type="date"
            className="px-4 py-2.5 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            添加
          </button>
        </div>
      </form>

      {/* Scheduled list */}
      <div className="space-card rounded-2xl p-6">
        <h2 className="font-mono text-lg font-bold mb-4">排期列表</h2>
        {scheduled.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">暂无排期内容</p>
        ) : (
          <div className="space-y-2">
            {scheduled.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--accent)] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{entry.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {entry.platform} · {entry.updatedAt.toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--star-soft)] text-[var(--star)]">
                  待发布
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
