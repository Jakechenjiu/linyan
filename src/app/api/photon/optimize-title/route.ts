import { auth } from "@/lib/auth";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";

const optimizePrompt = `你是一位资深的社交媒体内容运营专家，擅长优化内容标题以提高点击率。

## 任务
根据用户提供的内容正文和原标题，生成5个优化后的标题变体。

## 设计原则
- 针对目标平台优化风格（抖音要抓眼球、公众号要有深度感、小红书要有种草感）
- 使用该平台流行标题结构（数字列表、悬念反问、痛点共鸣、干货承诺等）
- 保持原意但更吸引点击
- 每个标题不超过30字
- 标题之间要有风格差异（不要都是同一种套路）

## 输出格式
严格返回以下JSON数组（不要包含markdown代码块标记）：
{
  "variants": [
    "标题变体1",
    "标题变体2",
    "标题变体3",
    "标题变体4",
    "标题变体5"
  ]
}`;

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

  const { title, body, platform } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
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

  const userMessage = `原标题：${title}
目标平台：${platform || "公众号"}
${body ? `内容正文（前500字）：\n${body.slice(0, 500)}` : ""}

请为以上内容生成5个优化后的标题变体。`;

  let content: string;
  try {
    content = await callAi({
      ...config,
      system: optimizePrompt,
      messages: [{ role: "user", content: userMessage }],
      max_tokens: 1024,
      temperature: 0.9,
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "AI 调用失败",
    }, { status: 500 });
  }

  try {
    const jsonStr = content.replace(/```json\s?|\```/g, "").trim();
    const result = JSON.parse(jsonStr);
    return NextResponse.json({ variants: result.variants || [] });
  } catch {
    // Fallback: try to extract lines
    const lines = content
      .split("\n")
      .map((l) => l.replace(/^\d+[\.\)\s、]*/, "").replace(/^["""]|["'""]$/g, "").trim())
      .filter((l) => l.length > 2 && l.length < 50);

    return NextResponse.json({ variants: lines.slice(0, 5) });
  }
}
