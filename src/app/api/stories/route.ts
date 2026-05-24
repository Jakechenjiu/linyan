import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stories = await prisma.story.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(stories);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, promptId, targetWordCount } = await req.json();
  const story = await prisma.story.create({
    data: {
      title: title?.trim() ?? "未命名短篇",
      content: content ?? "",
      wordCount: (content ?? "").length,
      promptId: promptId ?? null,
      targetWordCount: targetWordCount ?? 3000,
      userId: session.user.id,
    },
  });
  return NextResponse.json(story, { status: 201 });
}
