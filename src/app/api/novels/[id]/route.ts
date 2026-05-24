import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novel = await prisma.novel.findUnique({
    where: { id: (await params).id },
    include: { chapters: { orderBy: { order: "asc" } } },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(novel);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();
  const novel = await prisma.novel.updateMany({
    where: { id: (await params).id, userId: session.user.id },
    data: { title },
  });
  if (novel.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.novel.deleteMany({
    where: { id: (await params).id, userId: session.user.id },
  });
  return NextResponse.json({ success: true });
}
