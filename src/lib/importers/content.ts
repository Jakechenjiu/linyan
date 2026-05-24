import { prisma } from "@/lib/db";

interface ParsedContent {
  title: string;
  body: string;
  platform: string;
  contentType: string;
}

function parseJson(data: unknown): ParsedContent[] {
  const arr = Array.isArray(data) ? data : [data];
  return arr.map((item: any) => ({
    title: item.title || item.name || "未命名内容",
    body: item.body || item.content || item.text || "",
    platform: item.platform || "wechat",
    contentType: item.contentType || item.type || "article",
  }));
}

export async function importContent(
  userId: string,
  files: { name: string; content: string }[]
): Promise<number> {
  let count = 0;

  for (const file of files) {
    if (file.name.endsWith(".json")) {
      const data = JSON.parse(file.content);
      const items = parseJson(data);
      for (const item of items) {
        await prisma.content.create({
          data: {
            title: item.title,
            body: item.body,
            platform: item.platform,
            contentType: item.contentType,
            userId,
          },
        });
        count++;
      }
    } else {
      // Plain text/md → single content
      const lines = file.content.trim().split(/\r?\n/);
      const firstLine = lines[0].replace(/^#\s*/, "").trim();
      const title = firstLine.length > 60 ? firstLine.slice(0, 60) + "…" : firstLine || file.name.replace(/\.\w+$/, "");

      await prisma.content.create({
        data: {
          title,
          body: file.content,
          platform: "wechat",
          contentType: "article",
          userId,
        },
      });
      count++;
    }
  }

  return count;
}
