// 灵砚 AI 工具系统 — 照搬 InkOS 架构
// 高级业务工具 + 原始文件工具

import { prisma } from "@/lib/db";

export interface ToolResult {
  success: boolean;
  content: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: Record<string, string>) => Promise<ToolResult>;
}

// ── 高级业务工具（照搬 InkOS 的 write_truth_file / patch_chapter_text / sub_agent 模式）──

// write_chapter: 写入/覆盖整个章节（对标 InkOS 的 write）
export function createWriteChapterTool(novelId: string): AgentTool {
  return {
    name: "write_chapter",
    description: "将完整内容写入指定章节。用于续写新内容或整章重写。会覆盖原有内容。",
    parameters: {
      chapterId: { type: "string", description: "章节ID", required: true },
      content: { type: "string", description: "要写入的完整内容", required: true },
    },
    execute: async (params) => {
      const wordCount = params.content.replace(/\s/g, "").length;
      await prisma.chapter.update({
        where: { id: params.chapterId },
        data: { body: params.content, wordCount },
      });
      return { success: true, content: `已写入 ${wordCount} 字` };
    },
  };
}

// patch_chapter: 对章节做局部修补（对标 InkOS 的 patch_chapter_text）
export function createPatchChapterTool(novelId: string): AgentTool {
  return {
    name: "patch_chapter",
    description: "对章节做局部定点修补。查找目标文本并替换。用于小修改。",
    parameters: {
      chapterId: { type: "string", description: "章节ID", required: true },
      targetText: { type: "string", description: "要查找的原文", required: true },
      replacementText: { type: "string", description: "替换后的文本", required: true },
    },
    execute: async (params) => {
      const chapter = await prisma.chapter.findUnique({
        where: { id: params.chapterId },
        select: { body: true },
      });
      if (!chapter) return { success: false, content: "章节不存在" };
      const count = chapter.body.split(params.targetText).length - 1;
      if (count === 0) return { success: false, content: "未找到目标文本" };
      const newBody = chapter.body.split(params.targetText).join(params.replacementText);
      const wordCount = newBody.replace(/\s/g, "").length;
      await prisma.chapter.update({
        where: { id: params.chapterId },
        data: { body: newBody, wordCount },
      });
      return { success: true, content: `已替换 ${count} 处，当前 ${wordCount} 字` };
    },
  };
}

// read_chapter: 读取章节内容（对标 InkOS 的 read）
export function createReadChapterTool(novelId: string): AgentTool {
  return {
    name: "read_chapter",
    description: "读取指定章节的完整内容。",
    parameters: {
      chapterId: { type: "string", description: "章节ID", required: true },
    },
    execute: async (params) => {
      const chapter = await prisma.chapter.findUnique({
        where: { id: params.chapterId },
        select: { id: true, title: true, body: true, wordCount: true, order: true },
      });
      if (!chapter) return { success: false, content: "章节不存在" };
      return { success: true, content: `# ${chapter.title}\n\n${chapter.body}` };
    },
  };
}

// list_chapters: 列出所有章节（对标 InkOS 的 ls）
export function createListChaptersTool(novelId: string): AgentTool {
  return {
    name: "list_chapters",
    description: "列出小说的所有章节，包含ID、标题、字数、状态。",
    parameters: {},
    execute: async () => {
      const chapters = await prisma.chapter.findMany({
        where: { novelId },
        select: { id: true, title: true, wordCount: true, order: true },
        orderBy: { order: "asc" },
      });
      if (chapters.length === 0) return { success: true, content: "暂无章节" };
      const list = chapters.map((ch, i) => `${i + 1}. ${ch.title} (${ch.wordCount}字) [id:${ch.id}]`).join("\n");
      return { success: true, content: `共 ${chapters.length} 章：\n${list}` };
    },
  };
}

// search_content: 搜索内容（对标 InkOS 的 grep）
export function createSearchContentTool(novelId: string): AgentTool {
  return {
    name: "search_content",
    description: "在小说所有章节中搜索文本。用于查找角色名、地点等。",
    parameters: {
      pattern: { type: "string", description: "要搜索的文本", required: true },
    },
    execute: async (params) => {
      const chapters = await prisma.chapter.findMany({
        where: { novelId, body: { contains: params.pattern } },
        select: { id: true, title: true, body: true },
        orderBy: { order: "asc" },
      });
      if (chapters.length === 0) return { success: true, content: "未找到匹配内容" };
      const results = chapters.map((ch) => {
        const idx = ch.body.indexOf(params.pattern);
        const start = Math.max(0, idx - 30);
        const end = Math.min(ch.body.length, idx + params.pattern.length + 30);
        return `- ${ch.title}: "…${ch.body.slice(start, end)}…"`;
      });
      return { success: true, content: `找到 ${results.length} 处：\n${results.join("\n")}` };
    },
  };
}

// create_chapter: 创建新章节（对标 InkOS 的 write 新文件）
export function createCreateChapterTool(novelId: string): AgentTool {
  return {
    name: "create_chapter",
    description: "创建一个新章节。用于续写时创建新章节。",
    parameters: {
      title: { type: "string", description: "章节标题", required: true },
      body: { type: "string", description: "章节内容", required: true },
    },
    execute: async (params) => {
      const maxOrder = await prisma.chapter.aggregate({
        where: { novelId },
        _max: { order: true },
      });
      const order = (maxOrder._max.order || 0) + 1;
      const wordCount = params.body.replace(/\s/g, "").length;
      const chapter = await prisma.chapter.create({
        data: { novelId, title: params.title, body: params.body, order, wordCount },
      });
      return { success: true, content: `已创建章节「${params.title}」(${wordCount}字) [id:${chapter.id}]` };
    },
  };
}

// ── 创建所有工具 ──
export function createAgentTools(novelId: string): AgentTool[] {
  return [
    createReadChapterTool(novelId),
    createWriteChapterTool(novelId),
    createPatchChapterTool(novelId),
    createSearchContentTool(novelId),
    createListChaptersTool(novelId),
    createCreateChapterTool(novelId),
  ];
}
