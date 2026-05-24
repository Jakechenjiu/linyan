import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const story = await prisma.story.findUnique({ where: { id: (await params).id } });
  if (!story || story.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(story);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, targetWordCount, status, isPublic } = await req.json();
  const story = await prisma.story.updateMany({
    where: { id: (await params).id, userId: session.user.id },
    data: {
      title,
      content,
      wordCount: (content ?? "").length,
      targetWordCount,
      status,
      isPublic: isPublic ?? status === "published",
    },
  });
  if (story.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.story.deleteMany({
    where: { id: (await params).id, userId: session.user.id },
  });
  return NextResponse.json({ success: true });
}
