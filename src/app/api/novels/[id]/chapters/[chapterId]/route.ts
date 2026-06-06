import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: novelId, chapterId } = await params;

  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      novelId,
      novel: { userId: session.user.id },
    },
    select: {
      id: true,
      title: true,
      body: true,
      wordCount: true,
      order: true,
      updatedAt: true,
    },
  });

  if (!chapter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(chapter);
}
