import { prisma } from "@/lib/db";

interface ParsedChapter {
  title: string;
  body: string;
}

function parseTxt(content: string): { title: string; chapters: ParsedChapter[] } {
  // Try to find a title from the first line
  const lines = content.split(/\r?\n/);
  let title = lines[0]?.replace(/^#\s*/, "").trim() || "导入小说";
  let chapterStart = 1;

  // If first line looks like a real title (short, not a chapter marker), use it
  if (title.length > 30 || /^第.{1,4}[章节卷部]/.test(title)) {
    title = "导入小说";
    chapterStart = 0;
  }

  // Split by chapter markers
  const chapterPattern = /^(第.{1,8}[章节卷部集])\s*(.*)$/;
  const chapters: ParsedChapter[] = [];
  let currentChapter: ParsedChapter | null = null;

  for (let i = chapterStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(chapterPattern);
    if (match) {
      if (currentChapter) chapters.push(currentChapter);
      currentChapter = {
        title: match[0].trim(),
        body: "",
      };
    } else if (currentChapter) {
      currentChapter.body += line + "\n";
    } else {
      // Text before first chapter marker
      if (!currentChapter) {
        currentChapter = { title: "序章", body: "" };
      }
      currentChapter.body += line + "\n";
    }
  }

  if (currentChapter && currentChapter.body.trim()) {
    chapters.push(currentChapter);
  }

  // If no chapters detected, treat entire file as one chapter
  if (chapters.length === 0) {
    chapters.push({ title: "第一章", body: content });
  }

  return { title, chapters };
}

export async function importNovel(
  userId: string,
  files: { name: string; content: string }[]
): Promise<number> {
  let count = 0;

  for (const file of files) {
    if (file.name.endsWith(".epub")) {
      // EPUB not yet implemented
      continue;
    }

    const { title, chapters } = parseTxt(file.content);

    const novel = await prisma.novel.create({
      data: {
        title,
        userId,
        status: "writing",
      },
    });

    for (let i = 0; i < chapters.length; i++) {
      await prisma.chapter.create({
        data: {
          title: chapters[i].title,
          body: chapters[i].body,
          order: i + 1,
          wordCount: chapters[i].body.length,
          novelId: novel.id,
        },
      });
    }

    count++;
  }

  return count;
}
