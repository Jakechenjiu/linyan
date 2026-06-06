import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { exportTxt, exportEpub } from "@/lib/export";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "txt"; // txt | epub

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: { chapters: { orderBy: { order: "asc" } } },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (novel.chapters.length === 0) {
    return NextResponse.json({ error: "没有可导出的章节" }, { status: 400 });
  }

  const exportData = {
    title: novel.title,
    genre: novel.genre,
    synopsis: novel.synopsis,
    chapters: novel.chapters.map((ch) => ({
      order: ch.order,
      title: ch.title,
      body: ch.body,
      wordCount: ch.wordCount,
    })),
  };

  if (format === "epub") {
    try {
      const buffer = await exportEpub(exportData);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/epub+zip",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(novel.title)}.epub"`,
        },
      });
    } catch (e) {
      console.error("[Export] EPUB generation failed:", e);
      return NextResponse.json({ error: "EPUB 生成失败" }, { status: 500 });
    }
  }

  // 默认 TXT
  const content = exportTxt(exportData);
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(novel.title)}.txt"`,
    },
  });
}
