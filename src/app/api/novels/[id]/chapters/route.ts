import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({ where: { id: novelId } });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { title, body } = await req.json();
  const maxOrder = await prisma.chapter.aggregate({
    where: { novelId },
    _max: { order: true },
  });

  const chapter = await prisma.chapter.create({
    data: {
      title: title ?? "未命名章节",
      body: body ?? "",
      order: (maxOrder._max.order ?? 0) + 1,
      wordCount: (body ?? "").length,
      novelId,
    },
  });
  return NextResponse.json(chapter, { status: 201 });
}
