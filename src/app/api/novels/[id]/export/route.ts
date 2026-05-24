import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: { chapters: { orderBy: { order: "asc" } } },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const totalWords = novel.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const genreLabel = novel.genre || "未分类";

  const lines: string[] = [];
  lines.push(`《${novel.title}》`);
  lines.push(`类型：${genreLabel} | 总字数：${totalWords.toLocaleString()}`);
  lines.push("═".repeat(40));
  lines.push("");

  for (const ch of novel.chapters) {
    lines.push(`第${ch.order}章 ${ch.title}`);
    lines.push("─".repeat(30));
    lines.push(ch.body);
    lines.push("");
    lines.push("");
  }

  const content = lines.join("\n");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(novel.title)}.txt"`,
    },
  });
}
