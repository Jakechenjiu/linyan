import { prisma } from "@/lib/db";

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

export function parseWikilinks(body: string): string[] {
  const titles: string[] = [];
  for (const match of body.matchAll(WIKILINK_RE)) {
    const title = match[1].trim();
    if (title && !titles.includes(title)) titles.push(title);
  }
  return titles;
}

export async function syncLinks(fromId: string, body: string) {
  const refs = parseWikilinks(body);

  // Delete old links from this note
  await prisma.noteLink.deleteMany({ where: { fromId } });

  // Find target notes by title and create links
  if (refs.length > 0) {
    const targets = await prisma.note.findMany({
      where: { title: { in: refs } },
      select: { id: true },
    });
    if (targets.length > 0) {
      await prisma.noteLink.createMany({
        data: targets.map((t) => ({ fromId, toId: t.id })),
        skipDuplicates: true,
      });
    }
  }
}

export async function getBacklinks(noteId: string) {
  return prisma.noteLink.findMany({
    where: { toId: noteId },
    include: { fromNote: { select: { id: true, title: true } } },
    orderBy: { fromNote: { updatedAt: "desc" } },
  });
}

export async function getGraphData(userId: string) {
  const notes = await prisma.note.findMany({
    where: { userId },
    select: { id: true, title: true, tags: true },
  });

  const links = await prisma.noteLink.findMany({
    where: { fromNote: { userId } },
    select: { fromId: true, toId: true },
  });

  // Count incoming links for node sizing
  const inDegree = new Map<string, number>();
  for (const l of links) {
    inDegree.set(l.toId, (inDegree.get(l.toId) || 0) + 1);
  }

  const nodes = notes.map((n) => ({
    id: n.id,
    title: n.title,
    tags: JSON.parse(n.tags || "[]") as string[],
    degree: inDegree.get(n.id) || 0,
  }));

  return { nodes, edges: links.map((l) => ({ source: l.fromId, target: l.toId })) };
}
