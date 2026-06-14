import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";

const systemPrompt = `你是一位资深的网络文学编辑兼创作导师——"灵砚助手"。你的任务是通过对话引导作者完成一部新书的设定创建。

## 你的风格
- 热情但不浮夸，专业但不冰冷，像一位有经验的前辈编辑
- 每次只问1-2个问题，不要一口气抛出所有问题
- 根据作者的上一句回答自然推进话题，不要机械地按列表提问
- 对作者的想法给予简短反馈（"这个设定很有张力"、"这个金手指的设计空间很大"），然后自然引出下一个问题

## 你需要收集的信息
1. 故事核心：书名（可暂定）、一句话概括
2. 类型与体量：玄幻/修仙/系统流/都市异能/科幻/言情/悬疑/历史/规则怪谈/克苏鲁/废土/游戏
3. 主角：姓名、称号、欲望、缺陷、金手指
4. 世界观：世界类型、力量体系、势力格局、世界铁律
5. 反派：核心冲突（理念/利益/个人恩怨）
6. 开篇设计：起始场景、读者钩子

## 采访节奏
- 第1-2轮：聊概念和类型
- 第3-4轮：聊主角和金手指（网文核心）
- 第5-6轮：聊世界观和反派
- 第7-8轮：聊开篇和结构
- 作者给出充分信息时可跳过后续问题

## 完成信号
当你收集到足够信息后（至少需要书名/概念 + 类型 + 主角姓名），在回复的最后输出 FINALIZE 标记块。不要在前面加任何其他标记。

示例：
\`\`\`FINALIZE
{"title":"书名","genre":"xuanhuan",...}
\`\`\`

JSON 字段说明：
- title: 书名
- genre: 类型id，必须是以下之一: xuanhuan/xianxia/system/urban/scifi/romance/mystery/history/rules-mystery/cthulhu/wasteland/game
- synopsis: 一句话简介
- targetWordCount: 目标字数(数字)
- protagonist: {name, tagline, desire, flaw, goldenFinger}
- antagonist: {name, tagline, role: "ideological"|"interest"|"personal", conflict}
- worldType: cultivation/cyberpunk/cthulhu/wasteland/modern/other
- scale: single_city/multi_region/continent/multi_realm
- powerSystem: 力量体系描述(markdown)
- factions: 势力格局
- rules: 世界铁律
- volumes: [{"title":"第一卷","chapterCount":10,"summary":""}]
- openingHook: 开篇场景描述(至少100字)

如果用户说"开始创建吧"但信息不够，告知缺什么。信息足够时直接输出 FINALIZE 块。`;

// GET: 获取保存的对话进度
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 从数据库读取保存的对话（如果有）
  const saved = await (prisma as any).creationDraft?.findUnique?.({
    where: { userId: session.user.id },
  }) || null;

  return NextResponse.json({
    messages: saved?.messages ? JSON.parse(saved.messages) : [],
    data: saved?.wizardData ? JSON.parse(saved.wizardData) : null,
  });
}

// POST: 发送消息或保存进度
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, action, wizardData } = await req.json();

  // 保存对话进度
  if (action === "save") {
    try {
      await (prisma as any).creationDraft?.upsert?.({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          messages: JSON.stringify(messages || []),
          wizardData: JSON.stringify(wizardData || null),
        },
        update: {
          messages: JSON.stringify(messages || []),
          wizardData: JSON.stringify(wizardData || null),
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ saved: true });
    } catch {
      return NextResponse.json({ saved: false });
    }
  }

  // 清除保存的进度
  if (action === "clear") {
    try {
      await (prisma as any).creationDraft?.deleteMany?.({
        where: { userId: session.user.id },
      });
    } catch {
      // ignore
    }
    return NextResponse.json({ cleared: true });
  }

  // 正常 AI 对话
  if (!messages?.length) return NextResponse.json({ error: "Messages required" }, { status: 400 });

  const config = await getAiConfig(session.user.id);

  if (!config.hasKey) {
    return NextResponse.json({
      message: "请先在设置中配置您的 AI API Key",
      code: "NO_API_KEY",
    }, { status: 400 });
  }

  // 自动保存对话进度
  try {
    await (prisma as any).creationDraft?.upsert?.({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        messages: JSON.stringify(messages),
      },
      update: {
        messages: JSON.stringify(messages),
        updatedAt: new Date(),
      },
    });
  } catch {
    // 不阻塞主流程
  }

  let content: string;
  try {
    content = await callAi({
      ...config,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      max_tokens: 4096,
      temperature: 0.8,
    });
  } catch (e) {
    console.error("create-chat AI error:", e);
    return NextResponse.json({
      message: "AI 调用失败，请稍后重试",
      finalized: false,
    });
  }

  // Check for FINALIZE block
  const finalizeMatch = content.match(/```FINALIZE\s*([\s\S]*?)```/i);
  if (finalizeMatch) {
    try {
      const jsonStr = finalizeMatch[1].trim();
      const settings = JSON.parse(jsonStr);

      const novel = await prisma.novel.create({
        data: {
          title: settings.title || "未命名作品",
          genre: settings.genre || null,
          synopsis: settings.synopsis || null,
          targetWordCount: settings.targetWordCount || null,
          status: "planning",
          userId: session.user.id,
          worldSetting: (settings.worldType || settings.powerSystem || settings.factions || settings.rules)
            ? {
                create: {
                  worldType: settings.worldType || null,
                  scale: settings.scale || null,
                  powerSystem: settings.powerSystem || null,
                  factions: settings.factions || null,
                  rules: settings.rules || null,
                },
              }
            : undefined,
          characters: settings.protagonist?.name
            ? {
                create: [
                  {
                    name: settings.protagonist.name,
                    role: "protagonist",
                    tagline: settings.protagonist.tagline || null,
                    desire: settings.protagonist.desire || null,
                    flaw: settings.protagonist.flaw || null,
                    goldenFinger: settings.protagonist.goldenFinger || null,
                    sortOrder: 0,
                  },
                  ...(settings.antagonist?.name
                    ? [{
                        name: settings.antagonist.name,
                        role: "antagonist",
                        tagline: settings.antagonist.tagline || null,
                        relationships: settings.antagonist.conflict
                          ? JSON.stringify({ conflict: settings.antagonist.conflict, type: settings.antagonist.role || "interest" })
                          : null,
                        sortOrder: 1,
                      }]
                    : []),
                ],
              }
            : undefined,
          outlines: settings.volumes?.length
            ? {
                create: settings.volumes.map((v: { title: string; chapterCount: number; summary: string }, i: number) => ({
                  title: v.title || `第${i + 1}卷`,
                  type: "volume",
                  summary: v.summary || null,
                  sortOrder: i,
                })),
              }
            : undefined,
        },
      });

      if (settings.openingHook?.trim()) {
        await prisma.chapter.create({
          data: {
            title: "第1章",
            body: settings.openingHook.trim(),
            order: 1,
            wordCount: settings.openingHook.trim().length,
            novelId: novel.id,
          },
        });
      }

      // 清除保存的进度
      try {
        await (prisma as any).creationDraft?.deleteMany?.({
          where: { userId: session.user.id },
        });
      } catch {
        // ignore
      }

      const cleanContent = content.replace(/```FINALIZE[\s\S]*?```/i, "").trim();
      return NextResponse.json({
        message: cleanContent || "设定已生成！正在跳转到你的新书工作室…",
        novelId: novel.id,
        finalized: true,
      });
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json({ message: content, finalized: false });
    }
  }

  return NextResponse.json({ message: content, finalized: false });
}
