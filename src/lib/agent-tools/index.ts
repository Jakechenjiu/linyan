// 灵砚 AI 工具系统 — 使用原生工具调用
// 工具定义为 JSON Schema 格式，AI 原生调用

import { prisma } from "@/lib/db";
import type { AiTool } from "@/lib/ai";

// ── 工具定义 ──

// 读取章节
export const readChapterTool: AiTool = {
  name: "read_chapter",
  description: "读取指定章节的完整内容。可以用章节ID或序号（1=第1章）。",
  parameters: {
    chapterId: { type: "string", description: "章节ID或序号", required: true },
  },
};

// 写入章节
export const writeChapterTool: AiTool = {
  name: "write_chapter",
  description: "将内容写入指定章节。用于续写或整章重写。会覆盖原有内容。",
  parameters: {
    chapterId: { type: "string", description: "章节ID或序号", required: true },
    content: { type: "string", description: "要写入的完整内容", required: true },
  },
};

// 局部修改
export const patchChapterTool: AiTool = {
  name: "patch_chapter",
  description: "对章节做局部修补。查找目标文本并替换。用于小修改。",
  parameters: {
    chapterId: { type: "string", description: "章节ID或序号", required: true },
    targetText: { type: "string", description: "要查找的原文", required: true },
    replacementText: { type: "string", description: "替换后的文本", required: true },
  },
};

// 搜索内容
export const searchContentTool: AiTool = {
  name: "search_content",
  description: "在小说所有章节中搜索文本。用于查找角色名、地点等。",
  parameters: {
    pattern: { type: "string", description: "要搜索的文本", required: true },
  },
};

// 列出章节
export const listChaptersTool: AiTool = {
  name: "list_chapters",
  description: "列出小说的所有章节，包含序号、标题、字数。",
  parameters: {},
};

// 创建章节
export const createChapterTool: AiTool = {
  name: "create_chapter",
  description: "创建一个新章节。",
  parameters: {
    title: { type: "string", description: "章节标题", required: true },
    body: { type: "string", description: "章节内容", required: true },
  },
};

// 所有工具定义
export const allTools: AiTool[] = [
  readChapterTool,
  writeChapterTool,
  patchChapterTool,
  searchContentTool,
  listChaptersTool,
  createChapterTool,
];

// ── 工具执行 ──

export async function executeTool(
  name: string,
  input: Record<string, string>,
  novelId: string
): Promise<string> {
  switch (name) {
    case "read_chapter": {
      let chapter;
      chapter = await prisma.chapter.findUnique({
        where: { id: input.chapterId },
        select: { id: true, title: true, body: true, wordCount: true, order: true },
      });
      if (!chapter) {
        const orderNum = parseInt(input.chapterId, 10);
        if (!isNaN(orderNum)) {
          chapter = await prisma.chapter.findFirst({
            where: { novelId, order: orderNum },
            select: { id: true, title: true, body: true, wordCount: true, order: true },
          });
        }
      }
      if (!chapter) return `章节「${input.chapterId}」不存在`;
      return `# ${chapter.title} (${chapter.wordCount}字)\n\n${chapter.body}`;
    }

    case "write_chapter": {
      let chapter;
      chapter = await prisma.chapter.findUnique({ where: { id: input.chapterId }, select: { id: true } });
      if (!chapter) {
        const orderNum = parseInt(input.chapterId, 10);
        if (!isNaN(orderNum)) {
          chapter = await prisma.chapter.findFirst({ where: { novelId, order: orderNum }, select: { id: true } });
        }
      }
      if (!chapter) return `章节「${input.chapterId}」不存在`;
      const wordCount = input.content.replace(/\s/g, "").length;
      await prisma.chapter.update({ where: { id: chapter.id }, data: { body: input.content, wordCount } });
      return `已写入 ${wordCount} 字到章节`;
    }

    case "patch_chapter": {
      let chapter;
      chapter = await prisma.chapter.findUnique({ where: { id: input.chapterId }, select: { id: true, body: true } });
      if (!chapter) {
        const orderNum = parseInt(input.chapterId, 10);
        if (!isNaN(orderNum)) {
          chapter = await prisma.chapter.findFirst({ where: { novelId, order: orderNum }, select: { id: true, body: true } });
        }
      }
      if (!chapter) return `章节「${input.chapterId}」不存在`;
      const count = chapter.body.split(input.targetText).length - 1;
      if (count === 0) return "未找到目标文本";
      const newBody = chapter.body.split(input.targetText).join(input.replacementText);
      const wordCount = newBody.replace(/\s/g, "").length;
      await prisma.chapter.update({ where: { id: chapter.id }, data: { body: newBody, wordCount } });
      return `已替换 ${count} 处，当前 ${wordCount} 字`;
    }

    case "search_content": {
      const chapters = await prisma.chapter.findMany({
        where: { novelId, body: { contains: input.pattern } },
        select: { id: true, title: true, body: true },
        orderBy: { order: "asc" },
      });
      if (chapters.length === 0) return "未找到匹配内容";
      return chapters.map((ch) => {
        const idx = ch.body.indexOf(input.pattern);
        const start = Math.max(0, idx - 30);
        const end = Math.min(ch.body.length, idx + input.pattern.length + 30);
        return `- ${ch.title}: "…${ch.body.slice(start, end)}…"`;
      }).join("\n");
    }

    case "list_chapters": {
      const chapters = await prisma.chapter.findMany({
        where: { novelId },
        select: { id: true, title: true, wordCount: true, order: true },
        orderBy: { order: "asc" },
      });
      if (chapters.length === 0) return "暂无章节";
      return chapters.map((ch, i) => `${i + 1}. ${ch.title} (${ch.wordCount}字)`).join("\n");
    }

    case "create_chapter": {
      const maxOrder = await prisma.chapter.aggregate({ where: { novelId }, _max: { order: true } });
      const order = (maxOrder._max.order || 0) + 1;
      const wordCount = input.body.replace(/\s/g, "").length;
      await prisma.chapter.create({
        data: { novelId, title: input.title, body: input.body, order, wordCount },
      });
      return `已创建章节「${input.title}」(${wordCount}字)`;
    }

    default:
      return `未知工具: ${name}`;
  }
}
