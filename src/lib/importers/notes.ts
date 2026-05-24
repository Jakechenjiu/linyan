import { prisma } from "@/lib/db";
import { syncLinks } from "@/lib/notes";

interface ParsedNote {
  title: string;
  body: string;
  tags: string[];
}

function parseMarkdown(content: string): ParsedNote[] {
  const notes: ParsedNote[] = [];
  // Split by --- frontmatter blocks or ## headings
  const sections = content.split(/(?=^---$|^## )/m);

  let current: ParsedNote = { title: "", body: "", tags: [] };

  for (const section of sections) {
    // Try frontmatter
    const fmMatch = section.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)/);
    if (fmMatch) {
      if (current.title || current.body) {
        notes.push({ ...current });
      }
      const frontmatter = fmMatch[1];
      const body = fmMatch[2].trim();
      const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
      const tagsMatch = frontmatter.match(/^tags:\s*\[?(.+?)\]?\s*$/m);
      current = {
        title: titleMatch?.[1]?.trim() || "",
        body,
        tags: tagsMatch?.[1]
          ? tagsMatch[1].split(/[,，]\s*/).map((t) => t.replace(/["\[\]]/g, "").trim()).filter(Boolean)
          : [],
      };
      continue;
    }

    // Try ## heading as title
    const hdMatch = section.match(/^## (.+)\n([\s\S]*)/);
    if (hdMatch) {
      if (current.title || current.body) {
        notes.push({ ...current });
      }
      current = { title: hdMatch[1].trim(), body: hdMatch[2].trim(), tags: [] };
      continue;
    }

    // Plain content — append to current
    const trimmed = section.trim();
    if (trimmed && !current.title) {
      current.title = trimmed.split("\n")[0].slice(0, 80);
      current.body = trimmed;
    } else if (trimmed && current.title) {
      current.body = (current.body ? current.body + "\n\n" : "") + trimmed;
    }
  }

  if (current.title || current.body) {
    notes.push(current);
  }

  return notes;
}

function parseJson(data: unknown): ParsedNote[] {
  const arr = Array.isArray(data) ? data : [data];
  return arr.map((item: any) => ({
    title: item.title || item.name || "未命名笔记",
    body: item.body || item.content || item.text || "",
    tags: Array.isArray(item.tags) ? item.tags : [],
  }));
}

export async function importNotes(
  userId: string,
  files: { name: string; content: string }[]
): Promise<number> {
  let count = 0;

  for (const file of files) {
    let notes: ParsedNote[] = [];

    if (file.name.endsWith(".json")) {
      const data = JSON.parse(file.content);
      notes = parseJson(data);
    } else {
      notes = parseMarkdown(file.content);
    }

    for (const note of notes) {
      if (!note.title.trim()) continue;
      const created = await prisma.note.create({
        data: {
          title: note.title.trim(),
          body: note.body || "",
          tags: JSON.stringify(note.tags),
          userId,
        },
      });
      await syncLinks(created.id, note.body || "");
      count++;
    }
  }

  return count;
}
