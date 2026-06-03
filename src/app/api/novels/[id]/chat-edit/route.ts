import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAiStream } from "@/lib/ai";
import { ANTI_AI_RULES } from "@/lib/prompts";
import { NextResponse } from "next/server";
import { getAllTruthFiles, buildTruthFileContext } from "@/lib/truth-files";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId, message, bodyText, history } = await req.json();

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      worldSetting: true,
      characters: { orderBy: { sortOrder: "asc" } },
      codexEntries: true,
    },
  });

  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先在设置中配置您的 AI API Key", code: "NO_API_KEY" }, { status: 400 });
  }

  // Build context
  const parts: string[] = [];
  parts.push(`# 小说: ${novel.title}`);
  if (novel.genre) parts.push(`类型: ${novel.genre}`);
  if (novel.synopsis) parts.push(`简介: ${novel.synopsis}`);

  if (novel.characters.length > 0) {
    parts.push("\n## 角色设定");
    for (const c of novel.characters) {
      const fields: string[] = [`- ${c.name}(${c.role})`];
      if (c.tagline) fields.push(`称号: ${c.tagline}`);
      if (c.personality) fields.push(`性格: ${c.personality}`);
      if (c.desire) fields.push(`欲望: ${c.desire}`);
      if (c.flaw) fields.push(`缺陷: ${c.flaw}`);
      parts.push(fields.join(" | "));
    }
  }

  if (novel.worldSetting) {
    const ws = novel.worldSetting;
    parts.push("\n## 世界观");
    if (ws.worldType) parts.push(`世界类型: ${ws.worldType}`);
    if (ws.powerSystem) parts.push(`力量体系:\n${ws.powerSystem}`);
    if (ws.rules) parts.push(`世界铁律:\n${ws.rules}`);
  }

  // Codex context
  if (novel.codexEntries.length > 0) {
    const worldRules = novel.codexEntries.filter((e) => e.type === "world_rule");
    if (worldRules.length > 0) {
      parts.push("\n## 世界规则");
      for (const entry of worldRules) {
        parts.push(`- ${entry.name}: ${entry.summary || entry.body?.slice(0, 200) || ""}`);
      }
    }
  }

  // Truth files — inject long-term memory
  try {
    const truthFiles = await getAllTruthFiles(novelId);
    const truthContext = buildTruthFileContext(truthFiles, { maxLength: 4000 });
    if (truthContext.trim()) {
      parts.push(`\n## 长期记忆（真相文件）\n${truthContext}`);
    }
  } catch (e) {
    console.warn("Failed to load truth files:", e);
  }

  const systemPrompt = `${parts.join("\n")}

## 你的角色
你是一位AI写作助手，正在与作者实时协作修改小说正文。

## 规则
${ANTI_AI_RULES}

## 工作方式
1. 作者会告诉你需要对正文做什么修改
2. 你直接输出修改后的【完整正文】
3. 不要添加任何解释、注释、前缀（如"好的，以下是修改后的版本"）
4. 直接以正文内容开头
5. 保持作者的写作风格和叙事节奏
6. 如果用户的要求与已有设定冲突，优先遵守已有设定
7. 如果用户只是在讨论/提问（不是修改指令），正常回复讨论内容，不要输出正文`;

  // Build messages array
  const messages = [
    ...(history || []).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" as const : "assistant" as const,
      content: m.content,
    })),
    {
      role: "user" as const,
      content: bodyText
        ? `当前正文：\n${bodyText}\n\n---\n\n${message}`
        : message,
    },
  ];

  const stream = callAiStream({
    ...config,
    system: systemPrompt,
    messages,
    max_tokens: 8192,
  });

  // Wrap stream to emit SSE events
  const encoder = new TextEncoder();
  const wrappedStream = new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Emit as SSE text event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: buffer })}\n\n`));
          buffer = "";
        }

        // Emit done event with final body
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", body: buffer })}\n\n`));
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(e) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(wrappedStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
