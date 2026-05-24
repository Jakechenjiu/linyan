"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveChapter(chapterId: string, title: string, body: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const wordCount = body.trim().length;

  // Get existing chapter to calculate diff
  const existing = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { wordCount: true, novelId: true, novel: { select: { userId: true } } },
  });
  if (!existing || existing.novel.userId !== session.user.id) return;

  await prisma.chapter.updateMany({
    where: { id: chapterId, novel: { userId: session.user.id } },
    data: { title: title?.trim(), body, wordCount },
  });

  // Track writing log — only record positive increments
  const diff = wordCount - existing.wordCount;
  if (diff > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.writingLog.upsert({
      where: {
        novelId_date: { novelId: existing.novelId, date: today },
      },
      create: { novelId: existing.novelId, date: today, wordCount: diff },
      update: { wordCount: { increment: diff } },
    });
  }

  revalidatePath(`/workspace/star/${existing.novelId}`);
}
