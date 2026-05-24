"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { redirect } from "next/navigation";
import { loadBuiltInTemplates } from "@/lib/templates";

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
}`;

export async function generateScript(formData: FormData) {
  let session;
  try {
    session = await auth();
  } catch {
    redirect("/workspace/photon/batch?error=身份验证失败，请刷新页面重试");
  }
  if (!session?.user?.id) redirect("/login");

  const topic = (formData.get("topic") as string)?.trim();
  if (!topic) redirect("/workspace/photon/batch?error=请输入视频主题");

  const style = (formData.get("style") as string) || "mix";
  const platform = (formData.get("platform") as string) || "douyin";
  const templateId = (formData.get("templateId") as string) || null;

  let config;
  try {
    config = await getAiConfig(session.user.id);
  } catch {
    redirect("/workspace/photon/batch?error=读取用户配置失败，请刷新页面重试");
  }
  if (!config.hasKey) {
    redirect("/workspace/photon/batch?error=请先在设置中配置您的+AI+API+Key");
  }

  const styleLabel = style === "mix" ? "混剪" : style === "talk" ? "口播" : "图文";

  // If template selected, prepend its prompt context
  let topicContext = `主题：${topic}`;
  if (templateId) {
    const templates = loadBuiltInTemplates();
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      topicContext += `\n参考风格：${tpl.name} — ${tpl.description}`;
    }
  }

  const userMessage = `${topicContext}
风格：${styleLabel}
平台：${platform === "douyin" ? "抖音" : platform}
${style === "talk" ? "注意：口播风格需要有主持人的画面分镜。" : ""}
${style === "image" ? "注意：图文风格以文字和静态画面为主，画面变化较慢。" : ""}

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
    redirect(`/workspace/photon/batch?error=${encodeURIComponent(e instanceof Error ? e.message : "AI调用失败")}`);
  }

  // Parse JSON
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
    redirect(`/workspace/photon/batch?error=${encodeURIComponent("AI脚本格式异常，请重试")}`);
  }

  if (!script.clips?.length) {
    redirect(`/workspace/photon/batch?error=${encodeURIComponent("未生成有效分镜，请尝试更具体的主题")}`);
  }

  let project;
  try {
    project = await prisma.videoProject.create({
      data: {
        title: script.title || topic,
        topic,
        platform,
        style: styleLabel,
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
    });
  } catch (e) {
    console.error("Failed to create video project:", e);
    redirect(`/workspace/photon/batch?error=${encodeURIComponent("数据库写入失败，请确认数据库已运行且表已创建")}`);
  }

  redirect(`/workspace/photon/studio/${project.id}`);
}
