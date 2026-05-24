import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novels = await prisma.novel.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { chapters: true } }, chapters: { select: { wordCount: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(novels);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const novel = await prisma.novel.create({
    data: { title: title.trim(), userId: session.user.id },
  });
  return NextResponse.json(novel, { status: 201 });
}
