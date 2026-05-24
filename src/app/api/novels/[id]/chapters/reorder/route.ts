import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { orderedIds } = await req.json();

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
  }

  // Verify ownership
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { userId: true },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Update all chapter orders in a transaction
  await prisma.$transaction(
    orderedIds.map((id: string, index: number) =>
      prisma.chapter.updateMany({
        where: { id, novelId },
        data: { order: index + 1 },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
