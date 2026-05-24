import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { GitBranch, Sparkles, FlaskConical, Plus, FileText } from "lucide-react";
import { loadBuiltInStoryPrompts } from "@/lib/prompts";

export default async function LabPage() {
  const session = await auth();
  const mindmaps = await prisma.mindMap.findMany({
    where: { userId: session?.user?.id },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  const stories = await prisma.story.findMany({
    where: { userId: session?.user?.id },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  const prompts = loadBuiltInStoryPrompts();

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">灵感实验室</h1>
        <p className="text-sm text-muted-foreground mt-1">思维脑图与短篇快速验证</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mindmaps */}
        <div className="space-card rounded-2xl p-6">
          <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
            <GitBranch size={20} className="text-[var(--cyan)]" />
            思维脑图
          </h2>
          {mindmaps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">还没有脑图，创建一个开始规划</p>
              <Link
                href="/workspace/lab/mindmap/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all"
              >
                <Plus size={14} /> 新建脑图
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {mindmaps.map((m) => (
                <Link
                  key={m.id}
                  href={`/workspace/lab/mindmap/${m.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--accent)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <p className="text-[11px] text-muted-foreground">{m.nodeCount} 节点</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {m.updatedAt.toLocaleDateString("zh-CN")}
                  </span>
                </Link>
              ))}
              <Link
                href="/workspace/lab/mindmap/new"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs text-[var(--cyan)] hover:bg-[var(--cyan-soft)] transition-colors"
              >
                <Plus size={12} /> 新建脑图
              </Link>
            </div>
          )}
        </div>

        {/* Stories */}
        <div className="space-card rounded-2xl p-6">
          <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-[var(--star)]" />
            短篇作品
          </h2>
          {stories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">还没有短篇，用AI快速生成</p>
              <Link
                href="/workspace/lab/story/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--star-soft)] text-[var(--star)] hover:bg-[var(--star)] hover:text-[#0a0e17] transition-all"
              >
                <Sparkles size={14} /> 生成短篇
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stories.map((s) => (
                <Link
                  key={s.id}
                  href={`/workspace/lab/story/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--accent)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">{s.wordCount} / {s.targetWordCount} 字</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    s.status === "published"
                      ? "bg-[var(--cyan-soft)] text-[var(--cyan)]"
                      : "bg-[var(--accent)] text-muted-foreground"
                  }`}>
                    {s.status === "published" ? "已发布" : "草稿"}
                  </span>
                </Link>
              ))}
              <Link
                href="/workspace/lab/story/create"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs text-[var(--star)] hover:bg-[var(--star-soft)] transition-colors"
              >
                <Sparkles size={12} /> 生成新短篇
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Prompt cards */}
      <div>
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--cyan)]" />
          Prompt 库
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((p) => (
            <Link
              key={p.id}
              href={`/workspace/lab/story/create?prompt=${p.id}`}
              className="space-card rounded-xl p-4 group"
            >
              <h3 className="font-mono font-bold text-sm mb-1 group-hover:text-[var(--cyan)] transition-colors">
                {p.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
              <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-muted-foreground">
                {p.category}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
