import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic, platform = "wechat" } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "请输入主题" }, { status: 400 });
  }

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先配置 AI API Key" }, { status: 400 });
  }

  const platformStyles: Record<string, string> = {
    wechat: "公众号深度文章，2000-3000字，分段清晰，有观点有案例",
    xiaohongshu: "小红书种草笔记，口语化，带emoji，3-5个要点，1000字以内",
    douyin: "抖音短视频口播脚本，60秒节奏，开头抓眼球",
    weibo: "微博话题，140字以内，观点犀利",
    zhihu: "知乎回答，专业深度，分点论述，有数据有案例",
    bilibili: "B站视频文案，有趣有料，有互动引导",
  };

  try {
    const systemPrompt = `你是一位专业的内容创作者。根据用户提供的主题，生成一篇高质量的文章。

平台风格：${platformStyles[platform] || platformStyles.wechat}

要求：
- 标题吸引人
- 内容有价值，不是空洞的废话
- 结构清晰，易于阅读
- 直接输出标题和正文，不要其他内容`;

    const content = await callAi({
      ...config,
      system: systemPrompt,
      messages: [{ role: "user", content: `主题：${topic}` }],
      max_tokens: 4000,
      temperature: 0.7,
    });

    // Extract title and body
    const lines = content.split("\n").filter(Boolean);
    let title = lines[0]?.replace(/^#+\s*/, "") || topic.slice(0, 50);
    let body = lines.slice(1).join("\n").trim();

    // If first line looks like a title (short), use it
    if (title.length > 100) {
      title = topic.slice(0, 50);
      body = content;
    }

    // Create content
    const contentRecord = await prisma.content.create({
      data: {
        title,
        body,
        platform,
        wordCount: body.replace(/\s/g, "").length,
        status: "draft",
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      contentId: contentRecord.id,
      title: contentRecord.title,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "创建失败" },
      { status: 500 }
    );
  }
}
