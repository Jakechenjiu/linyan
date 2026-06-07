import { prisma } from "./db";
import {
  buildTruthFileContext,
  type TruthFileType,
} from "./truth-files";
import { getCachedTruthFiles } from "./cache";
import { buildMultiCharacterContext } from "./character-agent/context-builder";

// ============ 类型定义 ============

export interface ChapterIntent {
  goal: string;           // 本章目标
  mustKeep: string[];     // 必须保留的元素
  mustAvoid: string[];    // 必须避免的元素
  endState: string;       // 章尾必须发生的改变
  openingMandate?: string; // 开场指令
  characterFocus?: string; // 角色焦点
}

export interface ContextPackage {
  selectedContext: string;  // 从真相文件中选择的上下文
  ruleStack: RuleStack;     // 规则栈
  tokenEstimate: number;    // 预估 token 数
}

export interface RuleStack {
  hard: string[];        // 硬护栏（不可违反）
  soft: string[];        // 软约束（尽量遵守）
  diagnostic: string[];  // 诊断规则（用于审计）
}

// ============ Plan 阶段 ============

/** 生成章节意图（Plan） */
export async function planChapter(
  novelId: string,
  outlineId: string,
  chapterNumber: number,
  externalContext?: string
): Promise<ChapterIntent> {
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      worldSetting: true,
      characters: { orderBy: { sortOrder: "asc" } },
      outlines: { orderBy: { sortOrder: "asc" } },
      chapters: { orderBy: { order: "desc" }, take: 5 },
    },
  });
  if (!novel) throw new Error("Novel not found");

  // 处理虚拟大纲（自动续写）
  let outline: { id: string; title: string; summary: string | null; wordTarget: number | null } | null = null;
  if (outlineId === "auto") {
    outline = {
      id: "auto",
      title: `第${chapterNumber}章`,
      summary: "基于前文自动续写",
      wordTarget: 2000,
    };
  } else {
    outline = await prisma.outline.findUnique({
      where: { id: outlineId },
    });
    if (!outline) throw new Error("Outline not found");
  }

  // 读取真相文件
  const truthFiles = await getCachedTruthFiles(novelId);
  const truthContext = buildTruthFileContext(truthFiles, {
    maxLength: 4000,
    includeTypes: ["current_state", "pending_hooks", "chapter_summaries", "emotional_arcs"],
  });

  // 构建 Plan prompt
  const planSystem = `你是一位资深网文编辑，负责为作者生成「章节意图」。

根据大纲、真相文件和前几章摘要，生成本章的结构化意图。意图用来指导 AI 写这一章，必须具体、可操作。

严格按以下 JSON 格式输出（不要 markdown 代码块）：
{
  "goal": "本章必须完成的目标（1-2句）",
  "mustKeep": ["必须保留的元素1", "必须保留的元素2"],
  "mustAvoid": ["必须避免的元素1", "必须避免的元素2"],
  "endState": "章尾必须发生的改变（具体的状态变化）",
  "openingMandate": "本章必须以什么状态开场",
  "characterFocus": "本章的驱动角色是谁，他们的欲望冲突是什么"
}`;

  const contextParts: string[] = [];

  // 大纲
  contextParts.push(`## 本章大纲
标题: ${outline.title}
摘要: ${outline.summary || "(无)"}
目标字数: ${outline.wordTarget || 2000}`);

  // 角色设定
  if (novel.characters.length > 0) {
    contextParts.push("\n## 角色设定");
    for (const c of novel.characters) {
      const fields: string[] = [`- ${c.name} (${c.role})`];
      if (c.desire) fields.push(`欲望: ${c.desire}`);
      if (c.flaw) fields.push(`缺陷: ${c.flaw}`);
      if (c.personality) fields.push(`性格: ${c.personality}`);
      contextParts.push(fields.join(" | "));
    }
  }

  // 世界铁律
  if (novel.worldSetting?.rules) {
    contextParts.push(`\n## 世界铁律\n${novel.worldSetting.rules}`);
  }

  // 真相文件（长期记忆）
  if (truthContext.trim()) {
    contextParts.push(`\n## 长期记忆\n${truthContext}`);
  }

  // 前几章摘要
  if (novel.chapters.length > 0) {
    contextParts.push("\n## 前几章");
    for (const ch of novel.chapters.slice(0, 3)) {
      contextParts.push(`- ${ch.title}: ${ch.body.slice(0, 200)}...`);
    }
  }

  // 外部指令
  if (externalContext?.trim()) {
    contextParts.push(`\n## 用户指令\n${externalContext}`);
  }

  // 调用 AI 生成意图
  const { getAiConfig, callAi } = await import("@/lib/ai");
  const config = await getAiConfig(novel.userId);

  if (!config.hasKey) {
    // 没有 API Key，返回默认意图
    return {
      goal: `完成章节"${outline.title}"`,
      mustKeep: ["保持角色一致性", "遵守世界铁律"],
      mustAvoid: ["避免 AI 味表达", "避免平稳落地"],
      endState: "留下未解决的悬念或新问题",
      openingMandate: "延续上一章的状态",
      characterFocus: "主角",
    };
  }

  try {
    const result = await callAi({
      ...config,
      system: planSystem,
      messages: [{ role: "user", content: contextParts.join("\n") }],
      max_tokens: 1024,
      temperature: 0.3,
    });

    const parsed = JSON.parse(result.replace(/```json\s?|\```/g, "").trim());
    return {
      goal: parsed.goal || `完成章节"${outline.title}"`,
      mustKeep: parsed.mustKeep || [],
      mustAvoid: parsed.mustAvoid || [],
      endState: parsed.endState || "留下悬念",
      openingMandate: parsed.openingMandate,
      characterFocus: parsed.characterFocus,
    };
  } catch (e) {
    console.warn("Plan generation failed:", e);
    return {
      goal: `完成章节"${outline.title}"`,
      mustKeep: ["保持角色一致性", "遵守世界铁律"],
      mustAvoid: ["避免 AI 味表达", "避免平稳落地"],
      endState: "留下未解决的悬念或新问题",
    };
  }
}

// ============ Compose 阶段 ============

/** 编译章节上下文（Compose） */
export async function composeChapter(
  novelId: string,
  chapterIntent: ChapterIntent,
  outlineSummary?: string
): Promise<ContextPackage> {
  // 读取真相文件
  const truthFiles = await getCachedTruthFiles(novelId);

  // 根据意图选择相关真相文件
  const selectedTypes = selectRelevantTruthFiles(chapterIntent);
  const selectedContext = buildTruthFileContext(truthFiles, {
    includeTypes: selectedTypes,
    maxLength: 4000, // 减少真相文件空间，给角色 Agent 留空间
  });

  // 注入角色 Agent 上下文
  let characterContext = "";
  try {
    // 找到本章出场的角色
    const characters = await prisma.character.findMany({
      where: { novelId },
      select: { id: true, name: true, role: true, openness: true },
    });

    // 筛选焦点角色（有 Agent 数据的主角/反派）
    const focusCharacters = characters.filter(
      (c) => c.openness != null && (c.role === "protagonist" || c.role === "antagonist" || c.name === chapterIntent.characterFocus)
    );

    if (focusCharacters.length > 0) {
      characterContext = await buildMultiCharacterContext(
        focusCharacters.map((c) => c.id),
        "zh"
      );
    }
  } catch (e) {
    // 角色 Agent 数据不存在，跳过
  }

  // 合并上下文
  const fullContext = characterContext
    ? `${selectedContext}\n\n${characterContext}`
    : selectedContext;

  // 构建规则栈
  const ruleStack = buildRuleStack(chapterIntent);

  // 估算 token 数
  const tokenEstimate = estimateTokens(fullContext);

  return {
    selectedContext: fullContext,
    ruleStack,
    tokenEstimate,
  };
}

/** 根据意图选择相关真相文件 */
function selectRelevantTruthFiles(intent: ChapterIntent): TruthFileType[] {
  const types: TruthFileType[] = ["current_state", "chapter_summaries"];

  // 如果涉及伏笔，加入伏笔池
  if (
    intent.mustKeep.some((s) => s.includes("伏笔")) ||
    intent.mustAvoid.some((s) => s.includes("伏笔"))
  ) {
    types.push("pending_hooks");
  }

  // 如果涉及角色，加入情感弧线和角色矩阵
  if (intent.characterFocus) {
    types.push("emotional_arcs", "character_matrix");
  }

  // 如果涉及资源，加入资源账本
  if (
    intent.mustKeep.some((s) => s.includes("资源") || s.includes("物品")) ||
    intent.mustAvoid.some((s) => s.includes("资源"))
  ) {
    types.push("particle_ledger");
  }

  return [...new Set(types)];
}

/** 构建规则栈 */
function buildRuleStack(intent: ChapterIntent): RuleStack {
  const hard: string[] = [
    "保持角色一致性",
    "遵守世界铁律",
    "不使用禁用词汇（缓缓/淡淡/微微/轻轻/蓦然）",
    "不使用总结反思句（他知道…/这一刻…/从此以后…）",
    "不用标签化情绪（他感到X）",
    ...intent.mustKeep,
  ];

  const soft: string[] = [
    "保持与前文一致的叙事风格",
    "对话要有潜台词和意图冲突",
    "使用具体细节而非抽象描述",
    "章尾留下未解决的张力",
    ...intent.mustAvoid.map((s) => `避免：${s}`),
  ];

  const diagnostic: string[] = [
    "检查角色行为是否符合设定",
    "检查是否违反世界铁律",
    "检查伏笔是否被遗忘",
    "检查节奏是否单调",
    "检查是否有 AI 味表达",
  ];

  return { hard, soft, diagnostic };
}

/** 估算 token 数 */
function estimateTokens(text: string): number {
  // 粗略估算：中文 1 字 ≈ 2 token，英文 1 词 ≈ 1.5 token
  const chineseChars = (text.match(/[一-鿿]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars * 2 + englishWords * 1.5;
}

// ============ 上下文注入 ============

/** 构建注入 prompt 的治理上下文 */
export function buildGovernanceContext(
  intent: ChapterIntent,
  composed: ContextPackage,
  language: "zh" | "en" = "zh"
): string {
  const parts: string[] = [];

  // 章节意图
  parts.push(`## 本章意图
目标：${intent.goal}
开场状态：${intent.openingMandate || "延续上一章"}
驱动角色：${intent.characterFocus || "主角"}
章尾变化：${intent.endState}`);

  // 必须保留
  if (intent.mustKeep.length > 0) {
    parts.push(`\n### 必须保留
${intent.mustKeep.map((s) => `- ${s}`).join("\n")}`);
  }

  // 必须避免
  if (intent.mustAvoid.length > 0) {
    parts.push(`\n### 必须避免
${intent.mustAvoid.map((s) => `- ${s}`).join("\n")}`);
  }

  // 已选上下文（真相文件）
  if (composed.selectedContext.trim()) {
    parts.push(`\n## 相关记忆\n${composed.selectedContext}`);
  }

  // 规则栈
  parts.push(`\n## 规则栈
### 硬护栏（不可违反）
${composed.ruleStack.hard.map((s) => `- ${s}`).join("\n")}

### 软约束（尽量遵守）
${composed.ruleStack.soft.map((s) => `- ${s}`).join("\n")}`);

  return parts.join("\n");
}
