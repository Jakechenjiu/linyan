import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [contentStats, storyStats, novelStats] = await Promise.all([
    prisma.content.groupBy({
      by: ["status", "platform"],
      where: { userId: session.user.id },
      _count: true,
      _sum: { wordCount: true },
    }),
    prisma.story.aggregate({
      where: { userId: session.user.id },
      _count: true,
      _sum: { wordCount: true },
    }),
    prisma.novel.aggregate({
      where: { userId: session.user.id },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    contents: contentStats,
    totalStories: storyStats._count,
    totalStoryWords: storyStats._sum.wordCount ?? 0,
    totalNovels: novelStats._count,
    totalContentWords: contentStats.reduce((s, c) => s + (c._sum.wordCount ?? 0), 0),
  });
}
