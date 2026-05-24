import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body } = await req.json();
  const wordCount = (body ?? "").length;

  const chapter = await prisma.chapter.updateMany({
    where: { id: (await params).id, novel: { userId: session.user.id } },
    data: { title, body, wordCount },
  });
  if (chapter.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.chapter.deleteMany({
    where: { id: (await params).id, novel: { userId: session.user.id } },
  });
  return NextResponse.json({ success: true });
}
