"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveChapter(chapterId: string, title: string, body: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const wordCount = body.trim().length;
  await prisma.chapter.updateMany({
    where: { id: chapterId, novel: { userId: session.user.id } },
    data: { title: title?.trim(), body, wordCount },
  });

  revalidatePath(`/workspace/star/${session.user.id}`);
}
