import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { loadBuiltInStoryPrompts } from "@/lib/prompts";

export default async function StoryCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { prompt: promptId } = await searchParams;
  const prompts = loadBuiltInStoryPrompts();
  const selected = prompts.find((p) => p.id === promptId);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">短篇生成</h1>
        <p className="text-sm text-muted-foreground mt-1">AI驱动创意爆发，快速生成完整短篇</p>
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          const session = await auth();
          if (!session?.user?.id) return;
          const title = (formData.get("title") as string) || "未命名短篇";
          const promptId = formData.get("promptId") as string;
          const target = parseInt(formData.get("targetWordCount") as string) || 3000;

          const story = await prisma.story.create({
            data: {
              title: title.trim(),
              content: "",
              wordCount: 0,
              targetWordCount: target,
              promptId: promptId || null,
              userId: session.user.id,
            },
          });
          redirect(`/workspace/lab/story/${story.id}`);
        }}
        className="space-card rounded-2xl p-6 space-y-6"
      >
        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-2 block">短篇标题</label>
          <input
            name="title"
            placeholder="给短篇起个名字…"
            className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            选择 Prompt
            {selected && (
              <span className="ml-2 text-xs text-[var(--star)]">已选: {selected.name}</span>
            )}
          </label>
          <select
            name="promptId"
            defaultValue={promptId ?? ""}
            className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          >
            <option value="">自由创作</option>
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.category}] {p.name} — {p.description}
              </option>
            ))}
          </select>
        </div>

        {/* Target word count */}
        <div>
          <label className="text-sm font-medium mb-2 block">目标字数</label>
          <select
            name="targetWordCount"
            defaultValue="3000"
            className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          >
            <option value="1000">1000 字 (微型)</option>
            <option value="3000">3000 字 (短篇)</option>
            <option value="5000">5000 字 (中短篇)</option>
            <option value="10000">10000 字 (中篇)</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold bg-[var(--star)] hover:shadow-[0_0_20px_rgba(240,230,140,0.3)] transition-all"
          style={{ color: "#0a0e17" }}
        >
          <Sparkles size={18} />
          开始生成
        </button>
      </form>
    </div>
  );
}
