import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAiStream } from "@/lib/ai";
import { ANTI_AI_RULES } from "@/lib/prompts";
import { NextResponse } from "next/server";

const PLATFORM_CONTEXT: Record<string, string> = {
  wechat: "公众号：长文深度阅读，2000-5000字，分段清晰，有观点有案例",
  xiaohongshu: "小红书：种草笔记风格，口语化，带emoji，3-5个要点，1000字以内",
  douyin: "抖音：短视频文案，60秒口播节奏，开头3秒抓眼球，有行动号召",
  weibo: "微博：140字以内，观点犀利，有话题性，适合转发",
  zhihu: "知乎：专业深度回答，分点论述，有数据有案例",
  bilibili: "B站：中视频文案，有趣有料，有互动引导",
};

const REPURPOSE_PROMPTS: Record<string, string> = {
  "long-to-short": "将以下长文压缩为300字以内的精华摘要，保留核心观点和最有吸引力的信息",
  "text-to-script": "将以下文章改编为60秒短视频口播脚本，要求：开头3秒抓眼球，节奏快，有行动号召",
  "article-to-xhs": "将以下文章改编为小红书种草笔记，口语化，带emoji，3-5个要点",
  "article-to-zhihu": "将以下文章改编为知乎高赞回答格式，专业有深度，分点论述",
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentId = (await params).id;
  const { message, title, body, mode, targetPlatform } = await req.json();

  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content || content.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先在设置中配置您的 AI API Key" }, { status: 400 });
  }

  let systemPrompt: string;
  let userMessage: string;

  if (mode === "repurpose" && REPURPOSE_PROMPTS[message]) {
    // Content repurposing mode
    systemPrompt = `你是一位内容改写专家。${ANTI_AI_RULES}

要求：
- 直接输出改写后的内容，不要添加解释
- 保持核心信息不变
- 适配目标平台的风格`;
    userMessage = `${REPURPOSE_PROMPTS[message]}：\n\n标题：${title}\n正文：${body}`;
  } else if (mode === "multiplatform") {
    // Multi-platform adaptation
    const platformDesc = PLATFORM_CONTEXT[targetPlatform] || targetPlatform;
    systemPrompt = `你是一位多平台内容运营专家。${ANTI_AI_RULES}

将内容适配到以下平台风格：${platformDesc}

要求：
- 直接输出适配后的内容（标题+正文）
- 保持核心信息不变
- 适配目标平台的格式和风格
- 如果是短视频平台，要改编为口播脚本格式`;
    userMessage = `将以下内容适配到${targetPlatform}平台：\n\n标题：${title}\n正文：${body}`;
  } else {
    // Chat editing mode
    systemPrompt = `你是一位AI写作助手，正在与作者实时协作修改文章。

规则：
${ANTI_AI_RULES}

重要：
- 你必须输出修改后的【完整内容】（标题+正文）
- 不要添加任何解释、注释、前缀
- 直接以标题开头
- 保持作者的写作风格
- 如果用户只是在讨论/提问，正常回复讨论内容`;
    userMessage = `当前标题：${title}\n当前正文：${body}\n\n---\n\n${message}`;
  }

  const stream = callAiStream({
    ...config,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: buffer })}\n\n`));
          buffer = "";
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(e) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(wrappedStream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
