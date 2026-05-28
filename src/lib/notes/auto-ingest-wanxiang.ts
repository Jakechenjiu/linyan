import { prisma } from "@/lib/db";
import type { AnalysisResult } from "@/lib/wanxiang/analysis";

export async function ingestWanxiangToNotes(
  topic: string,
  report: string,
  analysis: AnalysisResult,
  userId: string
) {
  const title = `🔮 万象推演 · ${topic}`;
  const body = report;
  const tags = ["万象推演", "自动归纳"];

  const existing = await prisma.note.findFirst({
    where: { userId, tags: { contains: "万象推演" }, title },
    select: { id: true },
  });

  if (existing) {
    await prisma.note.update({
      where: { id: existing.id },
      data: { title, body, tags: JSON.stringify(tags) },
    });
    return { created: false, noteId: existing.id };
  }

  const note = await prisma.note.create({
    data: { title, body, tags: JSON.stringify(tags), userId },
  });
  return { created: true, noteId: note.id };
}
