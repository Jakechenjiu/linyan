import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { loadBuiltInTemplates } from "@/lib/templates";

const platforms = [
  { id: "wechat", label: "公众号" },
  { id: "xiaohongshu", label: "小红书" },
  { id: "douyin", label: "抖音" },
  { id: "weibo", label: "微博" },
  { id: "zhihu", label: "知乎" },
  { id: "bilibili", label: "B站" },
];

export default async function BatchPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { template: templateId } = await searchParams;
  const templates = loadBuiltInTemplates();
  const selected = templates.find((t) => t.id === templateId);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">批量生成</h1>
        <p className="text-sm text-muted-foreground mt-1">选择平台和模板，AI自动生成内容</p>
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          // Placeholder — will connect to AI service
          revalidatePath("/workspace/photon/batch");
        }}
        className="space-card rounded-2xl p-6 space-y-6"
      >
        {/* Topic */}
        <div>
          <label className="text-sm font-medium mb-2 block">创作主题</label>
          <input
            name="topic"
            placeholder="输入你要创作的主题或关键词…"
            className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
        </div>

        {/* Template */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            选择模板
            {selected && (
              <span className="ml-2 text-xs text-[var(--cyan)]">已选: {selected.name}</span>
            )}
          </label>
          <select
            name="templateId"
            defaultValue={templateId ?? ""}
            className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          >
            <option value="">不使用模板(自由生成)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.description}
              </option>
            ))}
          </select>
        </div>

        {/* Platforms */}
        <div>
          <label className="text-sm font-medium mb-2 block">目标平台 (可多选)</label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-card-border cursor-pointer hover:border-[var(--cyan)] transition-colors text-sm"
              >
                <input type="checkbox" name="platforms" value={p.id} className="accent-[var(--cyan)]" />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
          style={{ color: "#0a0e17" }}
        >
          <Sparkles size={18} />
          开始生成
        </button>
        <p className="text-xs text-muted-foreground">
          生成可能需要30-60秒，请耐心等待
        </p>
      </form>
    </div>
  );
}
