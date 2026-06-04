// 灵砚 AI 工具 — 简洁版，直接可用

import { prisma } from "@/lib/db";
import { AiTool } from "@/lib/ai";

// 工具定义（给 AI 看的）
export const toolDefinitions: AiTool[] = [
  {
    name: "read_chapter",
    description: "读取章节内容。参数: chapterId (章节ID或序号如1)",
    parameters: {
      chapterId: { type: "string", description: "章节ID或序号", required: true },
    },
  },
  {
    name: "write_chapter",
    description: "写入/覆盖章节内容。用于续写或整章重写。",
    parameters: {
      chapterId: { type: "string", description: "章节ID或序号", required: true },
      content: { type: "string", description: "要写入的完整内容", required: true },
    },
  },
  {
    name: "patch_chapter",
    description: "局部修改章节。查找并替换文本。",
    parameters: {
      chapterId: { type: "string", description: "章节ID或序号", required: true },
      targetText: { type: "string", description: "要查找的原文", required: true },
      replacementText: { type: "string", description: "替换后的文本", required: true },
    },
  },
  {
    name: "list_chapters",
    description: "列出所有章节",
    parameters: {},
  },
  {
    name: "search_content",
    description: "搜索小说内容",
    parameters: {
      pattern: { type: "string", description: "搜索关键词", required: true },
    },
  },
  {
    name: "create_chapter",
    description: "创建新章节",
    parameters: {
      title: { type: "string", description: "章节标题", required: true },
      body: { type: "string", description: "章节内容", required: true },
    },
  },
];

// 查找章节（支持ID或序号）
async function findChapter(novelId: string, chapterId: string) {
  let chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, title: true, body: true, wordCount: true, order: true },
  });
  if (!chapter) {
    const orderNum = parseInt(chapterId, 10);
    if (!isNaN(orderNum)) {
      chapter = await prisma.chapter.findFirst({
        where: { novelId, order: orderNum },
        select: { id: true, title: true, body: true, wordCount: true, order: true },
      });
    }
  }
  return chapter;
}

// 执行工具
export async function executeTool(
  name: string,
  args: Record<string, string>,
  novelId: string
): Promise<string> {
  try {
    switch (name) {
      case "read_chapter": {
        const chapter = await findChapter(novelId, args.chapterId);
        if (!chapter) return `章节「${args.chapterId}」不存在`;
        return `# ${chapter.title} (${chapter.wordCount}字)\n\n${chapter.body}`;
      }

      case "write_chapter": {
        const chapter = await findChapter(novelId, args.chapterId);
        if (!chapter) return `章节「${args.chapterId}」不存在`;
        const wordCount = args.content.replace(/\s/g, "").length;
        await prisma.chapter.update({
          where: { id: chapter.id },
          data: { body: args.content, wordCount },
        });
        return `已写入 ${wordCount} 字`;
      }

      case "patch_chapter": {
        const chapter = await findChapter(novelId, args.chapterId);
        if (!chapter) return `章节「${args.chapterId}」不存在`;
        const count = chapter.body.split(args.targetText).length - 1;
        if (count === 0) return "未找到目标文本";
        const newBody = chapter.body.split(args.targetText).join(args.replacementText);
        const wordCount = newBody.replace(/\s/g, "").length;
        await prisma.chapter.update({
          where: { id: chapter.id },
          data: { body: newBody, wordCount },
        });
        return `已替换 ${count} 处，${wordCount} 字`;
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

      case "search_content": {
        const chapters = await prisma.chapter.findMany({
          where: { novelId, body: { contains: args.pattern } },
          select: { title: true, body: true },
          orderBy: { order: "asc" },
        });
        if (chapters.length === 0) return "未找到";
        return chapters.map((ch) => {
          const idx = ch.body.indexOf(args.pattern);
          const start = Math.max(0, idx - 30);
          const end = Math.min(ch.body.length, idx + args.pattern.length + 30);
          return `${ch.title}: "…${ch.body.slice(start, end)}…"`;
        }).join("\n");
      }

      case "create_chapter": {
        const maxOrder = await prisma.chapter.aggregate({ where: { novelId }, _max: { order: true } });
        const order = (maxOrder._max.order || 0) + 1;
        const body = args.body || "";
        const wordCount = body.replace(/\s/g, "").length;

        if (wordCount === 0) {
          return `错误：章节内容不能为空。请提供 body 参数，写入完整的章节内容。`;
        }

        await prisma.chapter.create({
          data: { novelId, title: args.title, body, order, wordCount },
        });
        return `已创建「${args.title}」(${wordCount}字)\n\n内容预览：\n${body.slice(0, 200)}...`;
      }

      default:
        return `未知工具: ${name}`;
    }
  } catch (e) {
    return `工具执行失败: ${e instanceof Error ? e.message : "未知错误"}`;
  }
}
