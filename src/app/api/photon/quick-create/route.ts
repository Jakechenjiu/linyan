import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic, style = "混剪", aspectRatio = "9:16", platform = "douyin" } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "请输入主题" }, { status: 400 });
  }

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先配置 AI API Key" }, { status: 400 });
  }

  try {
    // 1. Generate script with AI
    const systemPrompt = `你是一位短视频脚本专家。根据用户提供的主题，生成一个结构化的分镜脚本。

输出JSON格式：
{
  "title": "视频标题",
  "hook": "开头钩子（3秒内抓住注意力）",
  "clips": [
    {
      "order": 0,
      "scriptText": "旁白文案",
      "visualPrompt": "画面描述（用于AI生成视频/图片）",
      "duration": 3
    }
  ],
  "cta": "结尾行动号召",
  "tags": ["标签1", "标签2"]
}

要求：
- 总时长控制在30-60秒
- 开头3秒必须有钩子
- 节奏紧凑，每句话都要有价值
- 结尾有明确的行动号召
- 风格：${style}
- 输出纯JSON，不要其他内容`;

    const scriptText = await callAi({
      ...config,
      system: systemPrompt,
      messages: [{ role: "user", content: `主题：${topic}\n风格：${style}\n平台：${platform}` }],
      max_tokens: 2000,
      temperature: 0.8,
    });

    // Parse script
    let scriptData;
    try {
      const jsonMatch = scriptText.match(/\{[\s\S]*\}/);
      scriptData = JSON.parse(jsonMatch ? jsonMatch[0] : scriptText);
    } catch {
      return NextResponse.json({ error: "脚本生成失败，请重试" }, { status: 500 });
    }

    // 2. Create project with clips
    const project = await prisma.videoProject.create({
      data: {
        title: scriptData.title || topic.slice(0, 50),
        topic,
        platform,
        style,
        script: JSON.stringify(scriptData),
        status: "draft",
        userId: session.user.id,
        clips: {
          create: (scriptData.clips || []).map((clip: { scriptText: string; visualPrompt: string; duration: number }, i: number) => ({
            order: i,
            scriptText: clip.scriptText || "",
            visualPrompt: clip.visualPrompt || "",
            duration: clip.duration || 3,
            status: "pending",
          })),
        },
      },
      include: { clips: true },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      title: project.title,
      clipCount: project.clips.length,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "创建失败" },
      { status: 500 }
    );
  }
}
