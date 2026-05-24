import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles } from "lucide-react";

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const content = await prisma.content.findUnique({ where: { id: (await params).id } });
  if (!content || content.userId !== session.user.id) notFound();

  async function save(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;
    const status = formData.get("status") as string;
    await prisma.content.updateMany({
      where: { id: content!.id, userId: session!.user!.id },
      data: {
        title: title?.trim(),
        body,
        wordCount: body.trim().length,
        status,
        isPublic: status === "published",
      },
    });
    revalidatePath(`/workspace/photon/editor/${content!.id}`);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link
          href="/workspace/photon"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors"
        >
          <ArrowLeft size={14} /> 返回光子面板
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{content.platform}</span>
          <span>·</span>
          <span>{content.wordCount} 字</span>
        </div>
      </div>

      <form action={save}>
        <div className="space-card rounded-2xl p-6">
          <input
            name="title"
            defaultValue={content.title}
            className="w-full font-mono text-2xl font-bold bg-transparent border-b border-card-border pb-3 mb-5 focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
          <textarea
            name="body"
            defaultValue={content.body}
            rows={Math.max(16, content.body.split("\n").length + 6)}
            className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
            placeholder="内容正文…"
          />

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-card-border">
            <div className="flex items-center gap-3">
              <select
                name="status"
                defaultValue={content.status}
                className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-card-border text-xs focus:outline-none"
              >
                <option value="draft">草稿</option>
                <option value="published">公开发布</option>
              </select>
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border hover:border-[var(--nebula)] text-[var(--nebula)] transition-colors"
              >
                <Sparkles size={12} /> AI 优化标题
              </button>
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
              style={{ color: "#0a0e17" }}
            >
              <Save size={14} /> 保存
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
