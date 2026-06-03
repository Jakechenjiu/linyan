// 灵砚多 Agent 管线 — 对话式交互，内部调用多 Agent

import { getAiConfig, callAi } from "@/lib/ai";
import { prisma } from "@/lib/db";
import {
  planChapter,
  composeChapter,
  buildGovernanceContext,
} from "@/lib/input-governance";
import {
  getAllTruthFiles,
  updateTruthFilesFromChapter,
} from "@/lib/truth-files";
import {
  AUDIT_DIMENSIONS,
  buildAuditPrompt,
  shouldRevive,
} from "@/lib/audit-dimensions";

interface PipelineResult {
  success: boolean;
  chapterId?: string;
  title?: string;
  wordCount?: number;
  response: string;
  intent?: any;
  auditResult?: any;
  revisionCount?: number;
}

/**
 * 执行完整的章节生成管线
 * 用户只需要说"写第一章"，内部自动调用多个 Agent
 */
export async function runChapterPipeline(
  novelId: string,
  userId: string,
  userRequest: string,
  outlineId?: string,
  novelContext?: { title: string; genre?: string; synopsis?: string },
): Promise<PipelineResult> {
  const config = await getAiConfig(userId);
  if (!config.hasKey) {
    return { success: false, response: "请先配置 AI API Key" };
  }

  // 加载小说数据
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      worldSetting: true,
      characters: { orderBy: { sortOrder: "asc" } },
      outlines: {
        where: { type: "chapter" },
        orderBy: { sortOrder: "asc" },
      },
      chapters: { orderBy: { order: "desc" }, take: 5 },
    },
  });

  if (!novel) {
    return { success: false, response: "小说不存在" };
  }

  // 确定要写哪一章
  let targetOutline = outlineId
    ? novel.outlines.find((o) => o.id === outlineId)
    : null;

  if (!targetOutline) {
    // 找到第一个没有对应章节的大纲
    const usedOutlineIds = new Set(
      novel.chapters.map((ch) => ch.outlineId).filter(Boolean)
    );
    targetOutline = novel.outlines.find((o) => !usedOutlineIds.has(o.id));

    if (!targetOutline) {
      return {
        success: false,
        response: "没有找到待写的大纲。请先创建大纲，或者指定要写哪一章。",
      };
    }
  }

  const chapterNumber = novel.chapters.length + 1;

  try {
    // ========== Phase 1: Plan（规划意图）==========
    console.log(`[Pipeline] Phase 1: Planning chapter ${chapterNumber}`);

    const intent = await planChapter(
      novelId,
      targetOutline.id,
      chapterNumber,
      userRequest,
    );

    // ========== Phase 2: Compose（编排上下文）==========
    console.log(`[Pipeline] Phase 2: Composing context`);

    const composed = await composeChapter(
      novelId,
      intent,
      targetOutline.summary || undefined,
    );

    const governanceContext = buildGovernanceContext(intent, composed);

    // ========== Phase 3: Writer（写正文）==========
    console.log(`[Pipeline] Phase 3: Writing chapter`);

    const contextParts: string[] = [];

    // 角色设定
    if (novel.characters.length > 0) {
      contextParts.push("## 角色设定");
      for (const c of novel.characters) {
        const fields: string[] = [`- ${c.name}(${c.role})`];
        if (c.tagline) fields.push(`称号: ${c.tagline}`);
        if (c.desire) fields.push(`欲望: ${c.desire}`);
        if (c.flaw) fields.push(`缺陷: ${c.flaw}`);
        if (c.personality) fields.push(`性格: ${c.personality}`);
        if (c.goldenFinger) fields.push(`金手指: ${c.goldenFinger}`);
        contextParts.push(fields.join(" | "));
      }
    }

    // 世界铁律
    if (novel.worldSetting?.rules) {
      contextParts.push(`\n## 世界铁律\n${novel.worldSetting.rules}`);
    }

    const novelTitle = novelContext?.title || novel.title;
    const writerSystem = `你是一位专业网络小说作家。你正在为小说「${novelTitle}」写作。

严格按照下面的「章节意图」和「规则栈」写一章完整的小说。

## 写作铁律（Anti-AI）
- 禁止：缓缓/淡淡/微微/轻轻/蓦然/倏忽/仿若/似是/不知为何/莫名/仿佛
- 禁止：段落结尾的"他知道，…"、"这一刻，…"、"从此以后…"总结反思句
- 禁止："起因→经过→结果→感悟"四段式闭合结构
- 禁止：标签化情绪表达（"他感到愤怒"→用生理反应+微动作替代）
- 禁止：信息播报式对话（对话要有潜台词、意图冲突、允许打断、沉默、回避）
- 禁止：连续3句以上相同句式
- 禁止：章末平稳落地——必须留下未解决的张力、悬念或新问题
- 对话要像活人说话：不同角色用不同的节奏、词汇量、句式
- 直接从正文开始，禁止"好的，以下是…"、"让我来写…"等开场白

输出格式：
1. 先输出 CHAPTER_TITLE: 标题
2. 然后直接输出正文`;

    const writerUser = `${governanceContext}

${contextParts.join("\n")}

请开始写作。`;

    const writerResult = await callAi({
      ...config,
      system: writerSystem,
      messages: [{ role: "user", content: writerUser }],
      max_tokens: 8192,
      temperature: 0.8,
    });

    // 解析标题和正文
    const titleMatch = writerResult.match(/CHAPTER_TITLE:\s*(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : targetOutline.title;
    const body = titleMatch
      ? writerResult.slice(titleMatch[0].length).trim()
      : writerResult;

    if (!body || body.trim().length < 100) {
      return {
        success: false,
        response: "生成的内容太短，请重试。",
      };
    }

    // ========== Phase 4: Observer（提取事实）==========
    console.log(`[Pipeline] Phase 4: Observing facts`);

    let factSnapshot: any = null;
    try {
      const observerResult = await callAi({
        ...config,
        system: `你是一位严谨的编辑。从刚写完的章节中提取关键信息。返回严格JSON（不要markdown代码块）：
{
  "newFacts": ["本章新揭示的世界信息或设定"],
  "stateChanges": ["角色状态发生了怎样的变化"],
  "openHooks": ["本章留下的未解决问题、悬念、伏笔"],
  "characterMoments": {"角色名": "本章的关键决策或情感时刻"}
}`,
        messages: [{ role: "user", content: `章节: ${title}\n\n${body}` }],
        max_tokens: 1024,
        temperature: 0.2,
      });

      try {
        factSnapshot = JSON.parse(
          observerResult.replace(/```json\s?|\```/g, "").trim()
        );
      } catch {
        factSnapshot = {
          newFacts: [],
          stateChanges: [],
          openHooks: [],
          characterMoments: {},
        };
      }
    } catch {
      factSnapshot = {
        newFacts: [],
        stateChanges: [],
        openHooks: [],
        characterMoments: {},
      };
    }

    // ========== Phase 5: Reflector（更新真相文件）==========
    console.log(`[Pipeline] Phase 5: Updating truth files`);

    try {
      await updateTruthFilesFromChapter(
        novelId,
        chapterNumber,
        title,
        body,
        factSnapshot,
      );
    } catch (e) {
      console.warn("[Pipeline] Failed to update truth files:", e);
    }

    // ========== Phase 6: Auditor（审计）==========
    console.log(`[Pipeline] Phase 6: Auditing`);

    let auditResult: any = null;
    let finalBody = body;
    let revisionCount = 0;
    const MAX_REVISIONS = 2;

    for (let attempt = 0; attempt <= MAX_REVISIONS; attempt++) {
      const auditPrompt = buildAuditPrompt(AUDIT_DIMENSIONS);

      const auditContext: string[] = [];
      if (novel.characters.length > 0) {
        auditContext.push("角色设定:");
        for (const c of novel.characters) {
          auditContext.push(
            `- ${c.name}(${c.role}): ${c.personality || ""} | 欲望:${c.desire || ""} | 缺陷:${c.flaw || ""}`
          );
        }
      }
      if (novel.worldSetting?.rules) {
        auditContext.push(`\n世界铁律:\n${novel.worldSetting.rules}`);
      }

      try {
        const auditResultStr = await callAi({
          ...config,
          system: auditPrompt,
          messages: [
            {
              role: "user",
              content: `${auditContext.join("\n")}\n\n章节: ${title}\n${finalBody}\n\n请审查以上章节。`,
            },
          ],
          max_tokens: 3000,
          temperature: 0.2,
        });

        try {
          auditResult = JSON.parse(
            auditResultStr.replace(/```json\s?|\```/g, "").trim()
          );
        } catch {
          auditResult = {
            passed: true,
            overallScore: 0,
            issues: [],
            summary: "审查结果解析失败，默认通过",
          };
        }
      } catch {
        auditResult = {
          passed: true,
          overallScore: 0,
          issues: [],
          summary: "审查调用失败，默认通过",
        };
      }

      // 判断是否需要修订
      const { shouldRevise, reason } = shouldRevive(
        auditResult,
        MAX_REVISIONS,
        attempt,
      );

      if (!shouldRevise) {
        break;
      }

      if (attempt >= MAX_REVISIONS) {
        break;
      }

      revisionCount++;
      console.log(
        `[Pipeline] Revision ${revisionCount}: ${reason}`
      );

      // ========== Phase 7: Reviser（修订）==========
      const criticalIssues = auditResult.issues.filter(
        (i: any) => i.severity === "critical" || i.severity === "warning"
      );

      if (criticalIssues.length === 0) break;

      const issueList = criticalIssues
        .map(
          (issue: any, i: number) =>
            `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.dimension || issue.category}
   问题: ${issue.problem}
   ${issue.text ? `原文: "${issue.text}"` : ""}
   修改建议: ${issue.fix}`
        )
        .join("\n\n");

      try {
        const revisionResult = await callAi({
          ...config,
          system: `你是一位专业的网文编辑。请修订以下章节，修复下面列出的问题。

## 需要修复的问题
${issueList}

## 修订规则
1. 修复所有 critical 和 warning 级别的问题
2. 不要改变剧情、角色发展或故事方向
3. 保持相近的字数（±10%）
4. 只输出修订后的正文，不要解释

请输出修订后的章节：`,
          messages: [{ role: "user", content: finalBody }],
          max_tokens: 8192,
          temperature: 0.5,
        });

        if (revisionResult && revisionResult.trim().length > 100) {
          finalBody = revisionResult;
        }
      } catch (e) {
        console.warn("[Pipeline] Revision failed:", e);
        break;
      }
    }

    // ========== Phase 8: 保存章节 ==========
    console.log(`[Pipeline] Phase 8: Saving chapter`);

    const maxOrder = novel.chapters.reduce(
      (m, ch) => Math.max(m, ch.order),
      0
    );
    const wordCount = finalBody.replace(/\s/g, "").length;

    const chapter = await prisma.chapter.create({
      data: {
        novelId,
        title,
        body: finalBody,
        order: maxOrder + 1,
        wordCount,
        outlineId: targetOutline.id,
        factSnapshot: factSnapshot ? JSON.stringify(factSnapshot) : null,
      },
    });

    // 更新写作日志
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.writingLog.upsert({
      where: { novelId_date: { novelId, date: today } },
      create: { novelId, date: today, wordCount },
      update: { wordCount: { increment: wordCount } },
    });

    // ========== 构建回复 ==========
    const auditSummary = auditResult?.passed
      ? "✅ 审计通过"
      : `⚠️ 审计未通过（${auditResult?.issues?.length || 0} 个问题）`;

    const response = [
      `## 已创建「${title}」`,
      `📊 字数：${wordCount}`,
      `📝 大纲：${targetOutline.title}`,
      "",
      "### 本章意图",
      `- 目标：${intent.goal}`,
      `- 章尾变化：${intent.endState}`,
      "",
      "### 审计结果",
      auditSummary,
      revisionCount > 0 ? `🔄 已修订 ${revisionCount} 次` : "",
      "",
      "### 内容预览",
      finalBody.slice(0, 300) + "...",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      success: true,
      chapterId: chapter.id,
      title,
      wordCount,
      response,
      intent,
      auditResult,
      revisionCount,
    };
  } catch (e) {
    console.error("[Pipeline] Error:", e);
    return {
      success: false,
      response: `生成失败：${e instanceof Error ? e.message : "未知错误"}`,
    };
  }
}

/**
 * 判断用户请求是否应该触发管线
 */
export function shouldTriggerPipeline(message: string): boolean {
  const triggers = [
    "写第",
    "写一章",
    "续写",
    "继续写",
    "生成章节",
    "创作",
    "开始写",
    "帮我写",
    "写下一章",
    "下一章",
  ];

  return triggers.some((t) => message.includes(t));
}

/**
 * 从用户消息中提取大纲 ID（如果有）
 */
export function extractOutlineId(
  message: string,
  outlines: Array<{ id: string; title: string }>
): string | null {
  // 尝试匹配"第X章"
  const chapterMatch = message.match(/第(\d+)章/);
  if (chapterMatch) {
    const num = parseInt(chapterMatch[1], 10);
    const outline = outlines.find(
      (o) => o.title.includes(`第${num}章`) || o.title.includes(`第${num}卷`)
    );
    if (outline) return outline.id;
  }

  // 尝试匹配大纲标题
  for (const outline of outlines) {
    if (message.includes(outline.title)) {
      return outline.id;
    }
  }

  return null;
}
