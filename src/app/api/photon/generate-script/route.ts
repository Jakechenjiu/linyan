import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";

const scriptSystemPrompt = `你是一位资深的抖音短视频编导，擅长设计爆款分镜脚本。

## 任务
根据用户提供的主题，生成一个抖音短视频的分镜脚本。每个分镜需包含旁白文案和画面描述。

## 设计原则
- 开头3秒必须抓眼球（hook）：悬念、反常识、强烈情绪、或视觉冲击
- 信息密度要高，不要废话
- 每个分镜时长3-8秒，总时长控制在30-90秒
- 画面描述用英文（用于AI视频生成），旁白用中文
- visualPrompt 格式：cinematic shot, [主体], [动作/场景], [光影/氛围], [镜头运动], 4K
- 结尾要有明确的行动号召（关注/点赞/评论）

## 输出格式
严格返回以下JSON（不要包含markdown代码块标记）：

{
  "title": "视频标题（吸引点击）",
  "hook": "开头3秒抓眼球策略的一句话描述",
  "clips": [
    {
      "scriptText": "旁白文案（中文）",
      "visualPrompt": "cinematic shot, subject, action, lighting, camera movement, 4K",
      "duration": 5.0
    }
  ],
  "cta": "结尾行动号召文案",
  "hashtags": ["标签1", "标签2", "标签3"]
}

注意：
- clips 数量根据内容需要决定，建议5-12个
- visualPrompt 必须详细且适合AI视频生成模型理解
- 如果风格是"口播"，前几个分镜可以是主持人口播画面
- 如果风格是"混剪"，各分镜画面应该有视觉多样性`;

export async function POST(req: Request) {
  let session;
  try {
    session = await auth();
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic, style, platform } = await req.json();

  if (!topic?.trim()) {
    return NextResponse.json({ error: "请输入视频主题" }, { status: 400 });
  }

  let config;
  try {
    config = await getAiConfig(session.user.id);
  } catch {
    return NextResponse.json({ error: "读取用户配置失败" }, { status: 500 });
  }

  if (!config.hasKey) {
    return NextResponse.json({
      error: "请先在设置中配置您的 AI API Key",
      code: "NO_API_KEY",
    }, { status: 400 });
  }

  const userMessage = `主题：${topic}
风格：${style || "混剪"}
平台：${platform || "抖音"}
${style === "口播" ? "注意：口播风格需要有主持人的画面分镜。" : ""}
${style === "图文" ? "注意：图文风格以文字和静态画面为主，画面变化较慢。" : ""}

请为以上主题设计分镜脚本。`;

  let content: string;
  try {
    content = await callAi({
      ...config,
      system: scriptSystemPrompt,
      messages: [{ role: "user", content: userMessage }],
      max_tokens: 4096,
      temperature: 0.9,
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "AI 调用失败",
    }, { status: 500 });
  }

  // Parse JSON from response
  let script: {
    title: string;
    hook: string;
    clips: { scriptText: string; visualPrompt: string; duration: number }[];
    cta: string;
    hashtags: string[];
  };

  try {
    const jsonStr = content.replace(/```json\s?|\```/g, "").trim();
    script = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({
      error: "AI 生成的脚本格式异常，请重试",
      raw: content.slice(0, 500),
    }, { status: 500 });
  }

  if (!script.clips?.length) {
    return NextResponse.json({
      error: "AI 未生成有效的分镜，请尝试更具体的主题描述",
    }, { status: 500 });
  }

  // Save to database
  let project;
  try {
    project = await prisma.videoProject.create({
      data: {
        title: script.title || topic,
        topic: topic.trim(),
        platform: platform || "douyin",
        style: style || null,
        script: JSON.stringify(script),
        userId: session.user.id,
        clips: {
          create: script.clips.map((clip, i) => ({
            order: i,
            scriptText: clip.scriptText,
            visualPrompt: clip.visualPrompt,
            duration: clip.duration || 5.0,
          })),
        },
      },
      include: { clips: { orderBy: { order: "asc" } } },
    });
  } catch (e) {
    return NextResponse.json({
      error: "数据库写入失败，请确认数据库已运行且表已创建",
      script,
    }, { status: 500 });
  }

  return NextResponse.json({ projectId: project.id, script });
}
