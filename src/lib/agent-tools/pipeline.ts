// 灵砚多 Agent 管线 — 对话式交互，内部调用多 Agent

import { getAiConfig, callAi } from "@/lib/ai";
import { prisma } from "@/lib/db";
import {
  planChapter,
  composeChapter,
  buildGovernanceContext,
} from "@/lib/input-governance";
import {
  updateTruthFilesFromChapter,
} from "@/lib/truth-files";
import {
  AUDIT_DIMENSIONS,
  buildAuditPrompt,
  shouldRevive,
} from "@/lib/audit-dimensions";
import { extractDialogueFingerprints, formatFingerprintsForPrompt } from "@/lib/voice-fingerprint";
import { buildGenreWritingGuidance } from "@/lib/genre-prompts";
import { filterRelevantContext } from "@/lib/smart-context";
import { analyzeRhythm } from "@/lib/rhythm-detector";
import { analyzeRootCauses, formatRootCauseForPrompt } from "@/lib/audit-root-cause";
import { getCachedTruthFiles, invalidateTruthFileCache } from "@/lib/cache";
import { buildMultiCharacterContext, loadCharacterAgent } from "@/lib/character-agent/context-builder";
import { doesCharacterKnow } from "@/lib/character-agent/knowledge";

interface PipelineResult {
  success: boolean;
  chapterId?: string;
  title?: string;
  wordCount?: number;
  response: string;
  intent?: {
    goal: string;
    mustKeep: string[];
    mustAvoid: string[];
    endState: string;
    openingMandate?: string;
    characterFocus?: string;
  };
  auditResult?: {
    passed: boolean;
    overallScore: number;
    issues: Array<{ severity: string; category: string; description: string }>;
    summary: string;
  };
  revisionCount?: number;
}

export interface PipelineProgress {
  stage: "plan" | "compose" | "write" | "observe" | "reflect" | "audit" | "revise" | "save";
  message: string;
  done?: boolean;
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
  onProgress?: (progress: PipelineProgress) => void,
): Promise<PipelineResult> {
  const progress = (stage: PipelineProgress["stage"], message: string) => {
    onProgress?.({ stage, message });
  };
  const config = await getAiConfig(userId);
  if (!config.hasKey) {
    return { success: false, response: "请先配置 AI API Key" };
  }

  // 并行加载小说数据和真相文件
  const [novel, truthFiles] = await Promise.all([
    prisma.novel.findUnique({
      where: { id: novelId },
      include: {
        worldSetting: true,
        characters: { orderBy: { sortOrder: "asc" } },
        outlines: {
          orderBy: { sortOrder: "asc" },
        },
        chapters: { orderBy: { order: "desc" }, take: 5 },
      },
    }),
    getCachedTruthFiles(novelId),
  ]);

  if (!novel) {
    return { success: false, response: "小说不存在" };
  }

  // 确定要写哪一章
  let targetOutline = outlineId
    ? novel.outlines.find((o) => o.id === outlineId)
    : null;

  if (!targetOutline) {
    // 找到第一个没有对应章节的叶子大纲（chapter 类型，或没有 children 的 volume）
    const usedOutlineIds = new Set(
      novel.chapters.map((ch) => ch.outlineId).filter(Boolean)
    );

    // 优先找 chapter 类型的大纲
    targetOutline = novel.outlines.find(
      (o) => o.type === "chapter" && !usedOutlineIds.has(o.id)
    );

    // 如果没有 chapter 类型，找没有 children 的 volume（当作单章大纲用）
    if (!targetOutline) {
      targetOutline = novel.outlines.find(
        (o) => o.type === "volume" && !usedOutlineIds.has(o.id)
      );
    }
  }

  // 如果没有大纲，创建一个虚拟大纲（基于前文续写）
  const hasOutline = !!targetOutline;
  const virtualOutline = !targetOutline ? {
    id: "auto",
    title: `第${novel.chapters.length + 1}章`,
    summary: `基于前文自动续写`,
    wordTarget: 2000,
  } : null;

  const effectiveOutline = targetOutline || virtualOutline!;

  const chapterNumber = novel.chapters.length + 1;

  try {
    // ========== Phase 1: Plan + 预处理（并行）==========
    progress("plan", "正在规划章节意图...");
    console.log(`[Pipeline] Phase 1: Planning chapter ${chapterNumber}`);

    // 并行：Plan + 声音指纹提取 + 节奏分析
    const [intent, voiceFingerprints, rhythm] = await Promise.all([
      planChapter(novelId, effectiveOutline.id, chapterNumber, userRequest),
      Promise.resolve(extractDialogueFingerprints(
        novel.chapters,
        novel.characters.map((c) => c.name)
      )),
      Promise.resolve(analyzeRhythm(novel.chapters)),
    ]);

    // ========== Phase 2: Compose（编排上下文）==========
    progress("compose", "正在编排上下文...");
    console.log(`[Pipeline] Phase 2: Composing context`);

    const composed = await composeChapter(
      novelId,
      intent,
      effectiveOutline.summary || undefined,
    );

    const governanceContext = buildGovernanceContext(intent, composed);

    // ========== Phase 3: Writer（写正文）==========
    progress("write", "正在写作...");
    console.log(`[Pipeline] Phase 3: Writing chapter`);

    // 使用已并行提取的声音指纹和节奏分析
    const fingerprintText = formatFingerprintsForPrompt(voiceFingerprints);

    // 题材专属写作指导
    const genreGuidance = buildGenreWritingGuidance(novel.genre || "other");

    // 智能上下文筛选
    const filteredTruthFiles = filterRelevantContext(truthFiles, {
      chapterGoal: intent.goal,
      characterFocus: intent.characterFocus,
      recentChapters: novel.chapters.slice(0, 3).map((ch) => ch.body),
    });

    // 使用已并行提取的节奏分析
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

    // 角色声音指纹
    if (fingerprintText) {
      contextParts.push(`\n## 角色对话风格\n${fingerprintText}`);
    }

    // 角色 Agent 上下文（大五人格 + 信息边界 + 行为约束）
    try {
      const focusCharacters = novel.characters.filter(
        (c) => c.role === "protagonist" || c.role === "antagonist"
      );
      if (focusCharacters.length > 0) {
        const agentContext = await buildMultiCharacterContext(
          focusCharacters.map((c) => c.id),
          "zh"
        );
        if (agentContext.trim()) {
          contextParts.push(`\n## 角色 Agent 深度设定\n${agentContext}`);
        }
      }
    } catch {
      // 角色 Agent 数据不存在，跳过
    }

    // 世界铁律
    if (novel.worldSetting?.rules) {
      contextParts.push(`\n## 世界铁律\n${novel.worldSetting.rules}`);
    }

    // 筛选后的真相文件
    const truthContextParts: string[] = [];
    for (const [type, content] of Object.entries(filteredTruthFiles)) {
      if (content.trim()) {
        truthContextParts.push(`### ${type}\n${content}`);
      }
    }
    if (truthContextParts.length > 0) {
      contextParts.push(`\n## 相关记忆\n${truthContextParts.join("\n\n")}`);
    }

    // 节奏提示
    if (rhythm.issues.length > 0) {
      const rhythmWarnings = rhythm.issues
        .map((i) => `- ${i.description}`)
        .join("\n");
      contextParts.push(`\n## 节奏提醒\n${rhythmWarnings}`);
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

${genreGuidance}

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
    const title = titleMatch ? titleMatch[1].trim() : effectiveOutline.title;
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
    progress("observe", "正在提取关键事实...");
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
    progress("reflect", "正在更新真相文件...");
    console.log(`[Pipeline] Phase 5: Updating truth files`);

    try {
      await updateTruthFilesFromChapter(
        novelId,
        chapterNumber,
        title,
        body,
        factSnapshot,
      );
      // 更新后清除缓存
      invalidateTruthFileCache(novelId);
    } catch (e) {
      console.warn("[Pipeline] Failed to update truth files:", e);
    }

    // ========== Phase 6: Auditor（审计）==========
    progress("audit", "正在审计...");
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

      // 注入角色信息边界（OOC 检查）— 使用缓存
      try {
        const { loadCharacterAgent: loadAgentCached } = await import("@/lib/character-agent/context-builder");
        const focusCharacters = novel.characters.filter(
          (c) => c.role === "protagonist" || c.role === "antagonist"
        );
        for (const c of focusCharacters) {
          const agent = await loadAgentCached(c.id);
          if (agent && agent.knowledge.length > 0) {
            const knownFacts = agent.knowledge
              .filter((k) => !k.isSecret)
              .map((k) => k.content)
              .slice(0, 10);
            if (knownFacts.length > 0) {
              auditContext.push(`\n${c.name}知道的事（信息边界）:\n${knownFacts.map((f) => `- ${f}`).join("\n")}`);
            }
          }
        }
      } catch {
        // 角色 Agent 数据不存在，跳过
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

      // 情感曲线验证（如果有目标曲线）
      try {
        const curves = await prisma.emotionalCurve.findMany({
          where: { novelId },
          orderBy: { createdAt: "desc" },
          take: 1,
        });
        if (curves.length > 0 && curves[0].targetCurve) {
          const { analyzeActualCurve, validateCurve } = await import("@/lib/emotional-curve/curve-validator");
          const targetCurve = JSON.parse(curves[0].targetCurve);
          const actualCurve = await analyzeActualCurve(finalBody, (system, user) =>
            callAi({ ...config, system, messages: [{ role: "user", content: user }], max_tokens: 1024, temperature: 0.2 })
          );
          if (actualCurve.length > 0) {
            const validation = validateCurve(targetCurve, actualCurve);
            if (validation.overallMatch < 60) {
              auditResult.issues.push({
                severity: "warning",
                category: "emotional_curve",
                description: `情感曲线匹配度低（${validation.overallMatch}%）`,
                suggestion: "调整叙事手段以更好地达到情感目标",
              });
            }
          }
        }
      } catch {
        // 情感曲线验证失败，跳过
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
      progress("revise", `修订中（第${revisionCount}轮：${reason}）...`);
      console.log(
        `[Pipeline] Revision ${revisionCount}: ${reason}`
      );

      // ========== Phase 7: Reviser（修订）==========
      const criticalIssues = auditResult.issues.filter(
        (i: any) => i.severity === "critical" || i.severity === "warning"
      );

      if (criticalIssues.length === 0) break;

      // 根因分析
      const rootCauseAnalyses = analyzeRootCauses(
        criticalIssues,
        finalBody,
        novel.chapters.slice(0, 3).map((ch) => ch.body)
      );
      const rootCauseText = formatRootCauseForPrompt(rootCauseAnalyses);

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

${rootCauseText ? `## 根因分析\n${rootCauseText}\n` : ""}
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
    progress("save", "正在保存...");
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
        outlineId: hasOutline ? effectiveOutline.id : null,
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
      `📝 ${hasOutline ? "大纲：" + effectiveOutline.title : "自动续写"}`,
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
  // 尝试匹配"第X章" — 优先匹配 chapter 类型
  const chapterMatch = message.match(/第(\d+)章/);
  if (chapterMatch) {
    const num = parseInt(chapterMatch[1], 10);
    // 先找 chapter 类型的精确匹配
    const chapterOutline = outlines.find(
      (o) => o.title.includes(`第${num}章`)
    );
    if (chapterOutline) return chapterOutline.id;
    // 再找 volume 类型
    const volumeOutline = outlines.find(
      (o) => o.title.includes(`第${num}卷`)
    );
    if (volumeOutline) return volumeOutline.id;
  }

  // 尝试匹配"第X卷"
  const volumeMatch = message.match(/第(\d+)卷/);
  if (volumeMatch) {
    const num = parseInt(volumeMatch[1], 10);
    const outline = outlines.find(
      (o) => o.title.includes(`第${num}卷`)
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
