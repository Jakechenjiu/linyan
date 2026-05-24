import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, Edit3, Eye } from "lucide-react";

export default async function StoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const story = await prisma.story.findUnique({ where: { id: (await params).id } });
  if (!story || story.userId !== session.user.id) notFound();

  const { edit } = await searchParams;
  const isEditing = edit === "1";

  async function save(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const status = formData.get("status") as string;
    await prisma.story.updateMany({
      where: { id: story!.id, userId: session!.user!.id },
      data: {
        title: title?.trim(),
        content,
        wordCount: content.trim().length,
        status,
        isPublic: status === "published",
      },
    });
    revalidatePath(`/workspace/lab/story/${story!.id}`);
  }

  const readTime = Math.max(1, Math.ceil(story.wordCount / 400));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link
          href="/workspace/lab"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors"
        >
          <ArrowLeft size={14} /> 返回实验室
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/workspace/lab/story/${story.id}?edit=${isEditing ? "0" : "1"}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-card-border hover:border-[var(--cyan)] transition-colors"
          >
            {isEditing ? <Eye size={12} /> : <Edit3 size={12} />}
            {isEditing ? "阅读模式" : "编辑模式"}
          </Link>
        </div>
      </div>

      {isEditing ? (
        <form action={save}>
          <div className="space-card rounded-2xl p-6">
            <input
              name="title"
              defaultValue={story.title}
              className="w-full font-mono text-2xl font-bold bg-transparent border-b border-card-border pb-3 mb-5 focus:outline-none focus:border-[var(--cyan)] transition-colors"
            />
            <textarea
              name="content"
              defaultValue={story.content}
              rows={Math.max(16, story.content.split("\n").length + 6)}
              className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
              placeholder="正文内容…"
            />
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-card-border">
              <div className="flex items-center gap-3">
                <select
                  name="status"
                  defaultValue={story.status}
                  className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-card-border text-xs focus:outline-none"
                >
                  <option value="draft">草稿</option>
                  <option value="published">公开发布</option>
                </select>
                <span className="text-xs text-muted-foreground">
                  {story.wordCount.toLocaleString()} / {story.targetWordCount.toLocaleString()} 字
                </span>
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
      ) : (
        <article className="space-card rounded-2xl p-8">
          <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-wide mb-4">
            {story.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-8 pb-6 border-b border-card-border">
            <span>{story.wordCount.toLocaleString()} 字</span>
            <span>约 {readTime} 分钟</span>
            <span>{story.createdAt.toLocaleDateString("zh-CN")}</span>
            {story.promptId && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--star-soft)] text-[var(--star)]">
                Prompt: {story.promptId}
              </span>
            )}
          </div>
          {story.content ? (
            <div className="prose prose-invert prose-sm max-w-none leading-relaxed whitespace-pre-wrap text-[15px]">
              {story.content}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles size={32} className="mx-auto mb-3" />
              <p className="mb-2">内容尚未生成</p>
              <p className="text-sm">点击编辑模式，使用 AI 生成内容</p>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
