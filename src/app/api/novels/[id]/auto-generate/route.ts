import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi, callAiStream } from "@/lib/ai";
import { NextResponse } from "next/server";
import {
  getAllTruthFiles,
  buildTruthFileContext,
  updateTruthFilesFromChapter,
  initializeTruthFiles,
  type TruthFileType,
} from "@/lib/truth-files";
import {
  planChapter,
  composeChapter,
  buildGovernanceContext,
} from "@/lib/input-governance";

// Shared anti-AI rules — also used in generate/route.ts
const ANTI_AI_RULES = `## 写作铁律（Anti-AI）
- 禁止：缓缓/淡淡/微微/轻轻/蓦然/倏忽/仿若/似是/不知为何/莫名/仿佛
- 禁止：段落结尾的"他知道，…"、"这一刻，…"、"从此以后…"总结反思句
- 禁止："起因→经过→结果→感悟"四段式闭合结构
- 禁止：标签化情绪表达（"他感到愤怒"→用生理反应+微动作替代）
- 禁止：信息播报式对话（对话要有潜台词、意图冲突、允许打断、沉默、回避）
- 禁止：连续3句以上相同句式
- 禁止：章末平稳落地——必须留下未解决的张力、悬念或新问题
- 禁止：解释性旁白和人物心理推断，让读者自己体会
- 对话要像活人说话：不同角色用不同的节奏、词汇量、句式
- 目标字数：{wordTarget} 字左右
- 直接从正文开始，禁止"好的，以下是…"、"让我来写…"等开场白`;

const BRIEF_SYSTEM = `你是一位资深网文编辑，负责为作者生成「写作任务书」。

根据大纲摘要，写一份结构化的写作任务书。任务书用来指导AI写这一章，所以必须具体、可操作。

严格按以下5段格式输出：

## 1. Opening Mandate（开场指令）
本章必须以什么状态开场——场景、氛围、角色的即时处境。1-2句。

## 2. Story Beats（关键事件）
必须发生的3-5个关键事件，按顺序列出。每个beat是具体的事件，不是抽象的方向。

## 3. Character Focus（角色焦点）
本章的驱动角色是谁？他们的情感状态和欲望冲突是什么？谁在主动推进剧情，谁在被动反应？

## 4. How to Write（叙事策略）
本章的叙事视角、节奏（快/慢/交替）、信息交付密度（暗示/直接揭示/留白）、与前一章的衔接方式。

## 5. Where to End（结束位置）
本章必须在什么位置结束。禁止平稳落地——必须是cliffhanger（悬念）、revelation（新信息揭示）、或decision point（角色的关键选择）。指定具体的情感余味（紧张/期待/不安/兴奋）。

输出纯文本，不要用markdown代码块包裹。直接以"## 1. Opening Mandate"开头。`;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { outlineId } = await req.json();
  if (!outlineId) return NextResponse.json({ error: "outlineId required" }, { status: 400 });

  // Load all context
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      worldSetting: true,
      characters: { orderBy: { sortOrder: "asc" } },
      outlines: { include: { chapters: { orderBy: { order: "desc" }, take: 1 } } },
      chapters: { orderBy: { order: "desc" }, take: 5 },
      codexEntries: true,
    },
  });
  if (!novel || novel.userId !== session.user!.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const outline = novel.outlines.find((o) => o.id === outlineId);
  if (!outline || outline.type !== "chapter") {
    return NextResponse.json({ error: "Outline not found or not a chapter" }, { status: 400 });
  }

  const config = await getAiConfig(session.user!.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先在设置中配置您的 AI API Key", code: "NO_API_KEY" }, { status: 400 });
  }

  const wordTarget = outline.wordTarget || 2000;

  // --- Load truth files ---
  let truthFiles: Record<string, string> = {};
  try {
    truthFiles = await getAllTruthFiles(novelId);
    // 如果没有任何真相文件，先初始化
    const hasAnyContent = Object.values(truthFiles).some((v) => v.trim().length > 0);
    if (!hasAnyContent) {
      await initializeTruthFiles(novelId);
      truthFiles = await getAllTruthFiles(novelId);
    }
  } catch (e) {
    console.warn("Failed to load truth files:", e);
  }

  // --- Build context for brief ---
  const contextParts: string[] = [];

  // Outline
  contextParts.push(`## 本章大纲\n标题: ${outline.title}\n摘要: ${outline.summary || "(无)"}`);
  if (outline.nodes) contextParts.push(`结构节点: ${outline.nodes}`);
  contextParts.push(`目标字数: ${wordTarget} 字`);

  // Characters
  if (novel.characters.length > 0) {
    contextParts.push("\n## 角色设定");
    for (const c of novel.characters) {
      const fields: string[] = [`- ${c.name} (${c.role})`];
      if (c.tagline) fields.push(`称号: ${c.tagline}`);
      if (c.desire) fields.push(`欲望: ${c.desire}`);
      if (c.flaw) fields.push(`缺陷: ${c.flaw}`);
      if (c.goldenFinger) fields.push(`金手指: ${c.goldenFinger}`);
      if (c.personality) fields.push(`性格: ${c.personality}`);
      if (c.wound) fields.push(`创伤: ${c.wound}`);
      if (c.need) fields.push(`内在需求: ${c.need}`);
      contextParts.push(fields.join(" | "));
    }
  }

  // World rules
  if (novel.worldSetting?.rules) {
    contextParts.push(`\n## 世界观铁律\n${novel.worldSetting.rules}`);
  }
  if (novel.worldSetting?.powerSystem) {
    contextParts.push(`\n## 力量体系\n${novel.worldSetting.powerSystem}`);
  }

  // Prior chapter (for continuity only)

  // Codex entries — keyword-matched context injection
  if (novel.codexEntries.length > 0) {
    const contextText = (outline.title || "") + " " + (outline.summary || "");
    const matched = novel.codexEntries.filter((entry) => {
      const keywords: string[] = JSON.parse(entry.keywords || "[]");
      if (keywords.length === 0) return entry.type === "world_rule";
      return keywords.some((kw) => contextText.includes(kw));
    });
    if (matched.length > 0) {
      contextParts.push("\n## 素材参考");
      for (const entry of matched) {
        contextParts.push(`- [${entry.type}] ${entry.name}: ${entry.summary || entry.body?.slice(0, 200) || ""}`);
      }
    }
  }

  // Truth files — inject long-term memory
  const truthContext = buildTruthFileContext(truthFiles as any, {
    maxLength: 6000,
  });
  if (truthContext.trim()) {
    contextParts.push(`\n## 长期记忆（真相文件）\n${truthContext}`);
  }

  const prevChapter = novel.chapters[0];
  if (prevChapter) {
    contextParts.push(`\n## 前一章结尾（仅作风格和连续性参考）\n${prevChapter.body.slice(-500)}`);
  }

  // Check if this outline already has a chapter (for "regenerate" case)
  const existingChapter = outline.chapters[0];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // === Phase 1: Plan + Compose (Input Governance) ===
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", message: "正在规划章节意图…" })}\n\n`));

        const chapterNumber = novel.chapters.length + 1;
        let chapterIntent: any;
        let composed: any;
        let governanceContext: string;

        try {
          // Plan: 生成章节意图
          chapterIntent = await planChapter(
            novelId,
            outlineId,
            chapterNumber,
            undefined // externalContext
          );

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "intent",
            goal: chapterIntent.goal,
            mustKeep: chapterIntent.mustKeep,
            mustAvoid: chapterIntent.mustAvoid,
            endState: chapterIntent.endState,
          })})}\n\n`));

          // Compose: 编译上下文
          composed = await composeChapter(
            novelId,
            chapterIntent,
            outline.summary || undefined
          );

          // 构建治理上下文
          governanceContext = buildGovernanceContext(chapterIntent, composed);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "status",
            message: `规划完成，已选择 ${composed.ruleStack.hard.length} 条硬护栏`,
          })})}\n\n`));
        } catch (e) {
          console.warn("Input governance failed, falling back to legacy:", e);
          // 降级到旧的写作任务书模式
          governanceContext = contextParts.join("\n");
        }

        // === Phase 2: Draft chapter (streaming, high temp) ===
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", message: "正在写作…" })}\n\n`));

        const draftSystem = `你是一位专业网络小说作家。严格按照下面的「章节意图」和「规则栈」写一章完整的小说。

角色设定和世界观铁律是必须遵守的约束。硬护栏不可违反，软约束尽量遵守。

${ANTI_AI_RULES.replace("{wordTarget}", String(wordTarget))}`;

        const draftUser = `${governanceContext}\n\n请开始写作。`;

        const aiStream = callAiStream({
          ...config,
          system: draftSystem,
          messages: [{ role: "user", content: draftUser }],
          max_tokens: 8192,
          temperature: 0.8,
        });

        const reader = aiStream.getReader();
        let fullBody = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = typeof value === "string" ? value : new TextDecoder().decode(value);
          fullBody += text;

          // Detect streamed errors
          if (fullBody.startsWith("[ERROR]")) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: fullBody.replace("[ERROR] ", "") })}\n\n`));
            controller.close();
            return;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`));
        }

        if (!fullBody.trim()) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "AI 返回了空内容" })}\n\n`));
          controller.close();
          return;
        }

        // === Phase 2.5: Post-write AI tell detection (zero LLM cost) ===
        const { detectAITells, autoFixAITells } = await import("@/lib/ai-tells");
        const aiTellResult = detectAITells(fullBody);

        if (!aiTellResult.passed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "ai_tell_warning",
            score: aiTellResult.score,
            issues: aiTellResult.issues.slice(0, 5), // 只发送前 5 个问题
          })})}\n\n`);

          // 尝试自动修复
          const { fixed, changes } = autoFixAITells(fullBody);
          if (changes.length > 0) {
            fullBody = fixed;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "status",
              message: `已自动修复 ${changes.length} 个 AI 痕迹`,
            })})}\n\n`));
          }
        }

        // === Phase 3: Settlement — fact extraction (non-streaming, low temp) ===
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", message: "正在结算…" })}\n\n`));

        let factSnapshot: any = null;
        try {
          const settlementResult = await callAi({
            ...config,
            system: `你是一位严谨的编辑。从刚写完的章节中提取关键信息。返回严格JSON（不要markdown代码块）：
{
  "newFacts": ["本章新揭示的世界信息或设定"],
  "stateChanges": ["角色状态发生了怎样的变化"],
  "openHooks": ["本章留下的未解决问题、悬念、伏笔"],
  "characterMoments": {"角色名": "本章的关键决策或情感时刻"}
}`,
            messages: [{ role: "user", content: `章节: ${outline.title}\n\n${fullBody}` }],
            max_tokens: 1024,
            temperature: 0.2,
          });

          try {
            factSnapshot = JSON.parse(settlementResult.replace(/```json\s?|\```/g, "").trim());
          } catch {
            factSnapshot = { newFacts: [], stateChanges: [], openHooks: [], characterMoments: {} };
          }
        } catch {
          factSnapshot = { newFacts: [], stateChanges: [], openHooks: [], characterMoments: {} };
        }

        // === Phase 3.5: Update truth files ===
        try {
          const chapterNumber = novel.chapters.length + 1;
          await updateTruthFilesFromChapter(
            novelId,
            chapterNumber,
            outline.title,
            fullBody,
            factSnapshot
          );
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", message: "真相文件已更新" })}\n\n`));
        } catch (e) {
          console.warn("Failed to update truth files:", e);
          // 不阻塞主流程
        }

        // === Phase 4: Audit + Revision Loop ===
        const {
          AUDIT_DIMENSIONS,
          buildAuditPrompt,
          buildRevisionPrompt,
          shouldRevive,
        } = await import("@/lib/audit-dimensions");

        let finalBody = fullBody;
        let auditResult: any = null;
        let revisionCount = 0;
        const MAX_REVISIONS = 2;

        for (let attempt = 0; attempt <= MAX_REVISIONS; attempt++) {
          const isRevision = attempt > 0;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                message: isRevision
                  ? `正在审查（第${attempt}轮修订后）…`
                  : "正在审查…",
              })}\n\n`
            )
          );

          try {
            // 构建审计上下文
            const contextLines: string[] = [];
            if (novel.characters.length > 0) {
              contextLines.push("角色设定:");
              for (const c of novel.characters) {
                contextLines.push(
                  `- ${c.name}(${c.role}): ${c.personality || ""} | 欲望:${c.desire || ""} | 缺陷:${c.flaw || ""}`
                );
              }
            }
            if (novel.worldSetting?.rules)
              contextLines.push(`\n世界铁律:\n${novel.worldSetting.rules}`);

            const auditPrompt = buildAuditPrompt(AUDIT_DIMENSIONS);

            const reviewResult = await callAi({
              ...config,
              system: auditPrompt,
              messages: [
                {
                  role: "user",
                  content: `${contextLines.join("\n")}\n\n章节: ${outline.title}\n${finalBody}\n\n请审查以上章节。`,
                },
              ],
              max_tokens: 3000,
              temperature: 0.2,
            });

            try {
              auditResult = JSON.parse(
                reviewResult.replace(/```json\s?|\```/g, "").trim()
              );
            } catch {
              auditResult = {
                passed: true,
                overallScore: 0,
                issues: [],
                summary: "审查结果解析失败，默认通过",
              };
            }

            // 判断是否需要修订
            const { shouldRevise, reason } = shouldRevive(
              auditResult,
              MAX_REVISIONS,
              attempt
            );

            if (!shouldRevise) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "status",
                    message: `审查完成：${auditResult.summary}${reason ? ` (${reason})` : ""}`,
                  })}\n\n`
                )
              );
              break;
            }

            // 需要修订
            if (attempt >= MAX_REVISIONS) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "status",
                    message: `已达到最大修订次数，保留当前版本`,
                  })}\n\n`
                )
              );
              break;
            }

            revisionCount++;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "status",
                  message: `发现问题，正在修订（${reason}）…`,
                })}\n\n`
              )
            );

            // 执行修订
            const criticalIssues = auditResult.issues.filter(
              (i: any) => i.severity === "critical" || i.severity === "warning"
            );

            if (criticalIssues.length === 0) {
              break;
            }

            const revisionPrompt = buildRevisionPrompt(criticalIssues);
            const revisionResult = await callAiStream({
              ...config,
              system: revisionPrompt.replace("{chapterContent}", ""),
              messages: [
                {
                  role: "user",
                  content: `请修订以下章节：\n\n${finalBody}`,
                },
              ],
              max_tokens: 8192,
              temperature: 0.5,
            });

            const revisionReader = revisionResult.getReader();
            let revisedBody = "";

            while (true) {
              const { done, value } = await revisionReader.read();
              if (done) break;

              const text =
                typeof value === "string"
                  ? value
                  : new TextDecoder().decode(value);
              revisedBody += text;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "revision_text",
                    content: text,
                    attempt: revisionCount,
                  })}\n\n`
                )
              );
            }

            if (revisedBody.trim()) {
              finalBody = revisedBody;
            }
          } catch (e) {
            console.warn(`Audit attempt ${attempt} failed:`, e);
            if (attempt === 0) {
              auditResult = {
                passed: true,
                overallScore: 0,
                issues: [],
                summary: "审查调用失败，默认通过",
              };
            }
            break;
          }
        }

        // === Phase 5: Final Save ===
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "status",
              message: "正在保存…",
            })}\n\n`
          )
        );

        // --- Create/Update Chapter record ---
        let chapterId: string;
        if (existingChapter) {
          chapterId = existingChapter.id;
          await prisma.chapter.updateMany({
            where: {
              id: existingChapter.id,
              novel: { userId: session.user!.id },
            },
            data: {
              title: outline.title,
              body: finalBody,
              wordCount: finalBody.trim().length,
              factSnapshot: JSON.stringify(factSnapshot),
              outlineId: outline.id,
            },
          });
        } else {
          const maxOrder = novel.chapters.reduce(
            (m, ch) => Math.max(m, ch.order),
            0
          );
          const created = await prisma.chapter.create({
            data: {
              title: outline.title,
              body: finalBody,
              order: maxOrder + 1,
              wordCount: finalBody.trim().length,
              factSnapshot: JSON.stringify(factSnapshot),
              novelId: novel.id,
              outlineId: outline.id,
            },
          });
          chapterId = created.id;
        }

        // Track writing log
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await prisma.writingLog.upsert({
          where: { novelId_date: { novelId: novel.id, date: today } },
          create: {
            novelId: novel.id,
            date: today,
            wordCount: finalBody.trim().length,
          },
          update: { wordCount: { increment: finalBody.trim().length } },
        });

        // Send done event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              chapterId,
              title: outline.title,
              wordCount: finalBody.trim().length,
              review: auditResult,
              factSnapshot,
              revisionCount,
              isRegenerate: !!existingChapter,
            })}\n\n`
          )
        );

        controller.close();
      } catch (e) {
        console.error("Auto-generate error:", e);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: `生成失败: ${e instanceof Error ? e.message : "未知错误"}` })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
