import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi, callAiStream } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const noteId = (await params).id;
  const action = new URL(req.url).searchParams.get("action") || "continue";

  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json(
      { error: "请先在设置中配置您的 AI API Key", code: "NO_API_KEY" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));

  switch (action) {
    case "continue":
      return handleContinue(config, note.title, body.body || note.body);
    case "summarize":
      return handleSummarize(config, note.title, body.body || note.body);
    case "polish":
      return handlePolish(config, body.text || "");
    case "tag-suggest":
      return handleTagSuggest(config, note.title, body.body || note.body);
    case "chat":
      return handleChat(config, note, body.question || "", body.body || note.body);
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

// --- Streaming: continue writing ---
function handleContinue(
  config: Awaited<ReturnType<typeof getAiConfig>>,
  title: string,
  noteBody: string
) {
  const system = `你是一位知识管理助手。用户正在写一篇笔记。请自然流畅地续写内容。

要求：
- 保持与已有内容一致的风格、语气和格式
- 如果笔记是技术类，保持精确；如果是创意类，保持想象力
- 不要重复已有内容
- 续写 200-500 字
- 不要用"好的，以下是我为您续写的内容："之类的开场白，直接写续写内容`;

  const context = noteBody.slice(-3000);
  const userMsg = `# ${title}\n\n已有内容：\n${context}\n\n请续写：`;

  const stream = callAiStream({
    ...config,
    system,
    messages: [{ role: "user", content: userMsg }],
    max_tokens: 2048,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// --- Non-streaming: summarize ---
async function handleSummarize(
  config: Awaited<ReturnType<typeof getAiConfig>>,
  title: string,
  noteBody: string
) {
  const text = await callAi({
    ...config,
    system: "你是一位知识管理助手。请用简洁的要点形式总结以下笔记内容。用中文。",
    messages: [
      { role: "user", content: `# ${title}\n\n${noteBody.slice(0, 8000)}\n\n请用 3-5 个要点总结这篇笔记。` },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  });

  return NextResponse.json({ result: text });
}

// --- Non-streaming: polish ---
async function handlePolish(
  config: Awaited<ReturnType<typeof getAiConfig>>,
  text: string
) {
  const polished = await callAi({
    ...config,
    system: `你是一位文字编辑。润色以下文本，使其更清晰流畅，修正语病和错别字，但保持原意和风格不变。
要求：
- 不要改变核心意思
- 保持原文的语气和风格
- 只输出润色后的文本，不要加任何解释`,
    messages: [{ role: "user", content: text }],
    max_tokens: 2048,
    temperature: 0.4,
  });

  return NextResponse.json({ result: polished });
}

// --- Non-streaming: tag suggestions ---
async function handleTagSuggest(
  config: Awaited<ReturnType<typeof getAiConfig>>,
  title: string,
  noteBody: string
) {
  const text = await callAi({
    ...config,
    system: `你是一位信息分类专家。分析笔记内容，建议 3-5 个标签（tag）。
要求：
- 标签应该是简短的关键词（中文或英文，2-6 字）
- 涵盖笔记的主题、领域、类型
- 输出 JSON 数组，例如：["标签1","标签2","标签3"]
- 只输出 JSON 数组，不要其他内容`,
    messages: [
      { role: "user", content: `# ${title}\n\n${noteBody.slice(0, 5000)}` },
    ],
    max_tokens: 256,
    temperature: 0.3,
  });

  let tags: string[] = [];
  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === "string");
  } catch {
    tags = text
      .replace(/[\[\]"]/g, "")
      .split(/[,，、]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return NextResponse.json({ tags });
}

// --- Streaming: chat with note context ---
function handleChat(
  config: Awaited<ReturnType<typeof getAiConfig>>,
  note: { title: string; body: string },
  question: string,
  noteBody: string
) {
  const system = `你是一位知识管理助手。用户正在阅读笔记，并就笔记内容提问。
请基于笔记内容回答问题。如果答案不在笔记中，如实说明。
引用笔记中的具体内容来支撑你的回答。`;

  const context = noteBody.slice(0, 8000);
  const userMsg = `# ${note.title}\n\n笔记内容：\n${context}\n---\n问题：${question || "请分析这篇笔记的主要内容"}`;

  const stream = callAiStream({
    ...config,
    system,
    messages: [{ role: "user", content: userMsg }],
    max_tokens: 2048,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
