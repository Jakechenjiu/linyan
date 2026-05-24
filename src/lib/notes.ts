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
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { title: true },
  });
  const noteTitle = note?.title || "";

  const links = await prisma.noteLink.findMany({
    where: { toId: noteId },
    include: { fromNote: { select: { id: true, title: true, body: true } } },
    orderBy: { fromNote: { updatedAt: "desc" } },
  });

  // Extract context snippets around the wikilink
  return links.map((link) => {
    const body = link.fromNote.body;
    let context: string | null = null;
    if (body && noteTitle) {
      const patterns = [
        `[[${noteTitle}]]`,
        `[[${noteTitle}|`,
      ];
      for (const pat of patterns) {
        const idx = body.indexOf(pat);
        if (idx !== -1) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(body.length, idx + pat.length + 30);
          let snippet = body.slice(start, end);
          if (start > 0) snippet = "…" + snippet;
          if (end < body.length) snippet = snippet + "…";
          context = snippet;
          break;
        }
      }
    }
    return {
      id: link.id,
      fromId: link.fromId,
      fromNote: { id: link.fromNote.id, title: link.fromNote.title },
      context,
    };
  });
}

export type Backlink = Awaited<ReturnType<typeof getBacklinks>>[number];

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
