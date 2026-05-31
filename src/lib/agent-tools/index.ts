// 灵砚 AI 工具系统 — 参考 InkOS agent-tools 设计
// 工具让 AI 能读取、修改、搜索小说内容

import { prisma } from "@/lib/db";

// ── 工具结果类型 ──
export interface ToolResult {
  success: boolean;
  content: string;
  details?: Record<string, unknown>;
}

// ── 工具定义 ──
export interface AgentTool {
  name: string;
  description: string;
  label: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: Record<string, string>) => Promise<ToolResult>;
}

// ── read: 读取章节内容 ──
export function createReadTool(novelId: string): AgentTool {
  return {
    name: "read",
    description: "读取指定章节的完整内容。用于了解当前写作状态。",
    label: "读取章节",
    parameters: {
      chapterId: { type: "string", description: "章节ID", required: true },
    },
    execute: async (params) => {
      const chapter = await prisma.chapter.findUnique({
        where: { id: params.chapterId },
        select: { id: true, title: true, body: true, wordCount: true, order: true },
      });
      if (!chapter) return { success: false, content: "章节不存在" };
      return {
        success: true,
        content: `# ${chapter.title}\n\n${chapter.body}`,
        details: { chapter },
      };
    },
  };
}

// ── write: 写入章节内容 ──
export function createWriteTool(novelId: string): AgentTool {
  return {
    name: "write",
    description: "将完整的新内容写入指定章节。会覆盖原有内容。",
    label: "写入章节",
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
      return {
        success: true,
        content: `已写入 ${wordCount} 字`,
        details: { wordCount },
      };
    },
  };
}

// ── edit: 查找替换 ──
export function createEditTool(novelId: string): AgentTool {
  return {
    name: "edit",
    description: "在章节中查找并替换文本。用于精确修改。",
    label: "查找替换",
    parameters: {
      chapterId: { type: "string", description: "章节ID", required: true },
      oldText: { type: "string", description: "要查找的文本", required: true },
      newText: { type: "string", description: "替换后的文本", required: true },
    },
    execute: async (params) => {
      const chapter = await prisma.chapter.findUnique({
        where: { id: params.chapterId },
        select: { body: true },
      });
      if (!chapter) return { success: false, content: "章节不存在" };

      const count = chapter.body.split(params.oldText).length - 1;
      if (count === 0) return { success: false, content: "未找到目标文本" };

      const newBody = chapter.body.split(params.oldText).join(params.newText);
      const wordCount = newBody.replace(/\s/g, "").length;
      await prisma.chapter.update({
        where: { id: params.chapterId },
        data: { body: newBody, wordCount },
      });
      return {
        success: true,
        content: `已替换 ${count} 处`,
        details: { count, wordCount },
      };
    },
  };
}

// ── grep: 搜索文本 ──
export function createGrepTool(novelId: string): AgentTool {
  return {
    name: "grep",
    description: "在小说的所有章节中搜索文本。用于查找角色名、地点等。",
    label: "搜索文本",
    parameters: {
      pattern: { type: "string", description: "要搜索的文本", required: true },
    },
    execute: async (params) => {
      const chapters = await prisma.chapter.findMany({
        where: { novelId, body: { contains: params.pattern } },
        select: { id: true, title: true, body: true },
        orderBy: { order: "asc" },
      });

      const results = chapters.map((ch) => {
        const idx = ch.body.indexOf(params.pattern);
        const start = Math.max(0, idx - 30);
        const end = Math.min(ch.body.length, idx + params.pattern.length + 30);
        const snippet = ch.body.slice(start, end);
        return `- ${ch.title}: "…${snippet}…"`;
      });

      return {
        success: true,
        content: results.length > 0
          ? `找到 ${results.length} 处：\n${results.join("\n")}`
          : "未找到匹配内容",
        details: { count: results.length },
      };
    },
  };
}

// ── list: 列出所有章节 ──
export function createListTool(novelId: string): AgentTool {
  return {
    name: "list",
    description: "列出小说的所有章节。用于了解整体结构。",
    label: "列出章节",
    parameters: {},
    execute: async () => {
      const chapters = await prisma.chapter.findMany({
        where: { novelId },
        select: { id: true, title: true, wordCount: true, order: true },
        orderBy: { order: "asc" },
      });

      const list = chapters
        .map((ch, i) => `${i + 1}. ${ch.title} (${ch.wordCount}字) [id:${ch.id}]`)
        .join("\n");

      return {
        success: true,
        content: chapters.length > 0 ? `共 ${chapters.length} 章：\n${list}` : "暂无章节",
        details: { chapters },
      };
    },
  };
}

// ── 创建所有工具 ──
export function createAgentTools(novelId: string): AgentTool[] {
  return [
    createReadTool(novelId),
    createWriteTool(novelId),
    createEditTool(novelId),
    createGrepTool(novelId),
    createListTool(novelId),
  ];
}
