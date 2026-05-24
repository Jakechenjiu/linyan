import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig } from "@/lib/ai";
import { NextResponse } from "next/server";

const systemPrompt = `你是一位资深的网络文学编辑兼创作导师——"灵砚助手"。你的任务是通过对话引导作者完成一部新书的设定创建。

## 你的风格
- 热情但不浮夸，专业但不冰冷，像一位有经验的前辈编辑
- 每次只问1-2个问题，不要一口气抛出所有问题
- 根据作者的上一句回答自然推进话题，不要机械地按列表提问
- 对作者的想法给予简短反馈（"这个设定很有张力"、"这个金手指的设计空间很大"），然后自然引出下一个问题
- 如果作者的回答很模糊，用具体选项或例子帮ta聚焦（"是偏向升级爽文，还是烧脑悬疑？"）

## 你需要收集的信息（不必按顺序，根据对话自然推进）

1. **故事核心**：书名（可以暂定）、一句话概括这个故事
2. **类型与体量**：什么类型？（玄幻/修仙/系统流/都市异能/科幻/言情/悬疑/历史/规则怪谈/克苏鲁/废土/游戏），目标字数？
3. **主角**：姓名、称号、欲望（外在目标）、缺陷（性格弱点）、金手指（特殊优势）
4. **世界观**：世界类型、力量体系/等级、势力格局、世界铁律
5. **反派**：主要反派是谁？和主角有什么核心冲突？（理念对立/利益冲突/个人恩怨）
6. **开篇设计**：故事从哪个场景开始？用什么钩子抓住读者？

## 采访节奏
- 第1-2轮：聊概念和类型（让作者充分表达想法）
- 第3-4轮：聊主角和金手指（这是网文的核心）
- 第5-6轮：聊世界观和反派
- 第7-8轮：聊开篇和结构
- 如果作者在某一轮给出了非常充分的信息，可以跳过后续相关问题

## 完成信号
当你收集到足够的信息后（至少需要：书名/概念 + 类型 + 主角姓名），回复的最后一行必须是：

\`\`\`FINALIZE
{完整的 JSON 设定}
\`\`\`

JSON 格式：
{
  "title": "书名",
  "genre": "类型id(xuanhuan/xianxia/system/urban/scifi/romance/mystery/history/rules-mystery/cthulhu/wasteland/game)",
  "synopsis": "一句话简介",
  "targetWordCount": 100000,
  "protagonist": {"name":"","tagline":"","desire":"","flaw":"","goldenFinger":""},
  "antagonist": {"name":"","tagline":"","role":"ideological/interest/personal","conflict":""},
  "worldType": "cultivation/cyberpunk/cthulhu/wasteland/modern/other",
  "scale": "single_city/multi_region/continent/multi_realm",
  "powerSystem": "力量体系描述(markdown)",
  "factions": "势力格局",
  "rules": "世界铁律",
  "volumes": [{"title":"第一卷","chapterCount":10,"summary":""}],
  "openingHook": "开篇场景描述"
}

如果用户明确说"开始创建吧"或"就这些"但你信息还不够，告知缺什么并继续收集。
如果信息已经足够，直接输出 FINALIZE 块。
注意：FINALIZE 必须是回复的最后一部分，JSON 要完整且有效。`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages }: { messages: { role: "user" | "assistant"; content: string }[] } = await req.json();

  if (!messages?.length) return NextResponse.json({ error: "Messages required" }, { status: 400 });

  const { apiKey, baseUrl, model, hasKey } = await getAiConfig(session.user.id);

  if (!hasKey) {
    return NextResponse.json({
      error: "请先在设置中配置您的 AI API Key",
      code: "NO_API_KEY",
    }, { status: 400 });
  }

  try {
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.8,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error("LLM error:", response.status, errBody.slice(0, 300));
      const msg = response.status === 401 || response.status === 403
        ? "API Key 无效，请检查设置中的密钥配置"
        : `AI 服务返回错误 (${response.status})，请稍后重试`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Check for FINALIZE block
    const finalizeMatch = content.match(/```FINALIZE\s*\n([\s\S]*?)```/);
    if (finalizeMatch) {
      try {
        const settings = JSON.parse(finalizeMatch[1].trim());
        // Create novel with all settings in a transaction
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

        // Create first chapter from opening hook
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

        const cleanContent = content.replace(/```FINALIZE[\s\S]*?```/, "").trim();
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
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json({ error: "对话失败，请重试" }, { status: 500 });
  }
}
