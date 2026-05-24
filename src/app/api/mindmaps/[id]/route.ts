import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mindmap = await prisma.mindMap.findUnique({ where: { id: (await params).id } });
  if (!mindmap || mindmap.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(mindmap);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, markdown } = await req.json();
  const nodeCount = (markdown?.match(/^#+\s/gm) || []).length;

  const mindmap = await prisma.mindMap.updateMany({
    where: { id: (await params).id, userId: session.user.id },
    data: { title, markdown, nodeCount },
  });
  if (mindmap.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.mindMap.deleteMany({
    where: { id: (await params).id, userId: session.user.id },
  });
  return NextResponse.json({ success: true });
}
