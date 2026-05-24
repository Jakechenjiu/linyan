import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const content = await prisma.content.findUnique({ where: { id: (await params).id } });
  if (!content || content.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(content);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, platform, contentType, status, isPublic } = await req.json();
  const content = await prisma.content.updateMany({
    where: { id: (await params).id, userId: session.user.id },
    data: {
      title,
      body,
      platform,
      contentType,
      wordCount: (body ?? "").length,
      status,
      isPublic: isPublic ?? status === "published",
    },
  });
  if (content.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.content.deleteMany({
    where: { id: (await params).id, userId: session.user.id },
  });
  return NextResponse.json({ success: true });
}
