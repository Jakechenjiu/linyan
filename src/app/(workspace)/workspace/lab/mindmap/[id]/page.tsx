import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save, GitBranch } from "lucide-react";

function parseMarkdownToTree(markdown: string) {
  const lines = markdown.split("\n").filter(Boolean);
  const root: { label: string; children: { label: string; children: { label: string; children: never[] }[] }[] } = {
    label: "Root",
    children: [],
  };
  const stack: { level: number; node: typeof root }[] = [{ level: 0, node: root }];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (!match) continue;
    const level = match[1].length;
    const label = match[2].trim();

    const newNode = { label, children: [] as typeof root.children };
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    if (stack.length > 0) {
      stack[stack.length - 1].node.children.push(newNode as any);
    }
    stack.push({ level, node: newNode as any });
  }
  return root;
}

function RenderNode({ node, x, y, level }: { node: { label: string; children: any[] }; x: number; y: number; level: number }) {
  const childSpacing = 50;
  const nodeWidth = 120;
  const nodeHeight = 32;

  return (
    <g>
      <rect
        x={x - nodeWidth / 2}
        y={y - nodeHeight / 2}
        width={nodeWidth}
        height={nodeHeight}
        rx={6}
        fill={level === 0 ? "var(--cyan)" : level === 1 ? "var(--nebula)" : "var(--accent)"}
        stroke={level === 0 ? "var(--cyan)" : "var(--card-border)"}
        strokeWidth={1}
      />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fill={level === 0 ? "#0a0e17" : "var(--foreground)"}
        fontSize={11}
        fontFamily="monospace"
      >
        {node.label.length > 14 ? node.label.slice(0, 14) + "…" : node.label}
      </text>
      {node.children.map((child: any, i: number) => {
        const childY = y + 60 + i * childSpacing;
        return (
          <g key={i}>
            <line x1={x} y1={y + nodeHeight / 2} x2={x} y2={childY - nodeHeight / 2} stroke="var(--card-border)" />
            <RenderNode node={child} x={x} y={childY} level={level + 1} />
          </g>
        );
      })}
    </g>
  );
}

export default async function MindMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const isNew = (await params).id === "new";
  let mindmap = null;

  if (!isNew) {
    mindmap = await prisma.mindMap.findUnique({ where: { id: (await params).id } });
    if (!mindmap || mindmap.userId !== session.user.id) notFound();
  }

  async function save(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;
    const title = formData.get("title") as string;
    const markdown = formData.get("markdown") as string;
    const nodeCount = (markdown.match(/^#+\s/gm) || []).length;

    const id = formData.get("id") as string;
    if (id === "new") {
      const created = await prisma.mindMap.create({
        data: { title: title?.trim() || "未命名脑图", markdown, nodeCount, userId: session.user.id },
      });
      redirect(`/workspace/lab/mindmap/${created.id}`);
    } else {
      await prisma.mindMap.updateMany({
        where: { id, userId: session.user.id },
        data: { title: title?.trim(), markdown, nodeCount },
      });
      revalidatePath(`/workspace/lab/mindmap/${id}`);
    }
  }

  const tree = parseMarkdownToTree(mindmap?.markdown ?? "");
  const hasContent = tree.children.length > 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Link
          href="/workspace/lab"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors"
        >
          <ArrowLeft size={14} />
        </Link>
        <h1 className="font-mono text-xl font-bold">
          {isNew ? "新建脑图" : mindmap?.title}
        </h1>
      </div>

      <div className="flex gap-6">
        {/* Markdown editor */}
        <form action={save} className="flex-1 space-y-4">
          <input type="hidden" name="id" value={isNew ? "new" : mindmap?.id} />
          <div className="space-card rounded-2xl p-6">
            <input
              name="title"
              defaultValue={mindmap?.title ?? ""}
              placeholder="脑图标题…"
              className="w-full font-mono text-lg font-bold bg-transparent border-b border-card-border pb-2 mb-4 focus:outline-none focus:border-[var(--cyan)] transition-colors"
            />
            <textarea
              name="markdown"
              defaultValue={mindmap?.markdown ?? "# 中心主题\n\n## 分支一\n### 子节点\n\n## 分支二\n### 子节点"}
              rows={20}
              className="w-full bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none"
              placeholder="用 Markdown 标题语法写大纲…"
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-card-border">
              <span className="text-xs text-muted-foreground">
                使用 # ## ### 表示层级
              </span>
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

        {/* Mind map preview */}
        <div className="flex-1 space-card rounded-2xl p-6 overflow-auto">
          <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
            <GitBranch size={18} className="text-[var(--cyan)]" />
            脑图预览
          </h2>
          {hasContent ? (
            <svg width="100%" height="500" className="min-w-[400px]">
              <RenderNode node={tree.children[0] || tree} x={200} y={30} level={0} />
            </svg>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">
              在左侧编辑 Markdown，右侧将实时显示脑图
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
