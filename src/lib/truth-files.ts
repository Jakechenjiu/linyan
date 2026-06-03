import { prisma } from "./db";

// 7 种真相文件类型
export type TruthFileType =
  | "current_state"      // 世界状态
  | "particle_ledger"    // 资源账本
  | "pending_hooks"      // 伏笔池
  | "chapter_summaries"  // 章节摘要
  | "subplot_board"      // 支线进度板
  | "emotional_arcs"     // 情感弧线
  | "character_matrix";  // 角色交互矩阵

export const TRUTH_FILE_TYPES: TruthFileType[] = [
  "current_state",
  "particle_ledger",
  "pending_hooks",
  "chapter_summaries",
  "subplot_board",
  "emotional_arcs",
  "character_matrix",
];

// 真相文件中文名称
export const TRUTH_FILE_LABELS: Record<TruthFileType, string> = {
  current_state: "世界状态",
  particle_ledger: "资源账本",
  pending_hooks: "伏笔池",
  chapter_summaries: "章节摘要",
  subplot_board: "支线进度板",
  emotional_arcs: "情感弧线",
  character_matrix: "角色交互矩阵",
};

// ============ 读取 ============

/** 读取单个真相文件 */
export async function getTruthFile(
  novelId: string,
  type: TruthFileType
): Promise<string | null> {
  const file = await prisma.truthFile.findUnique({
    where: { novelId_type: { novelId, type } },
  });
  return file?.content || null;
}

/** 读取所有真相文件 */
export async function getAllTruthFiles(
  novelId: string
): Promise<Record<TruthFileType, string>> {
  const files = await prisma.truthFile.findMany({
    where: { novelId },
  });

  const map: Record<string, string> = {};
  for (const f of files) {
    map[f.type] = f.content;
  }

  // 确保所有类型都有值
  const result: Record<TruthFileType, string> = {} as any;
  for (const type of TRUTH_FILE_TYPES) {
    result[type] = map[type] || "";
  }
  return result;
}

// ============ 写入 ============

/** 更新单个真相文件（upsert） */
export async function updateTruthFile(
  novelId: string,
  type: TruthFileType,
  content: string
): Promise<void> {
  await prisma.truthFile.upsert({
    where: { novelId_type: { novelId, type } },
    create: { novelId, type, content, version: 1 },
    update: {
      content,
      version: { increment: 1 },
      updatedAt: new Date(),
    },
  });
}

/** 批量更新真相文件 */
export async function updateTruthFiles(
  novelId: string,
  updates: Partial<Record<TruthFileType, string>>
): Promise<void> {
  const promises = Object.entries(updates)
    .filter(([, content]) => content !== undefined && content !== null)
    .map(([type, content]) =>
      updateTruthFile(novelId, type as TruthFileType, content!)
    );
  await Promise.all(promises);
}

// ============ 初始化 ============

/** 初始化所有真相文件（创书时调用） */
export async function initializeTruthFiles(novelId: string): Promise<void> {
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      worldSetting: true,
      characters: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!novel) throw new Error("Novel not found");

  // 构建初始内容
  const currentState = buildInitialState(novel);
  const characterMatrix = buildInitialCharacterMatrix(novel.characters);

  // 创建所有真相文件
  const promises = TRUTH_FILE_TYPES.map((type) => {
    let content = "";
    switch (type) {
      case "current_state":
        content = currentState;
        break;
      case "character_matrix":
        content = characterMatrix;
        break;
      case "chapter_summaries":
        content = buildInitialChapterSummaries();
        break;
      // 其他类型初始为空
      default:
        content = "";
    }

    return prisma.truthFile.upsert({
      where: { novelId_type: { novelId, type } },
      create: { novelId, type, content, version: 1 },
      update: {}, // 已存在则不覆盖
    });
  });

  await Promise.all(promises);
}

// ============ 更新逻辑（每章生成后调用）===========

/** 根据 factSnapshot 更新真相文件 */
export async function updateTruthFilesFromChapter(
  novelId: string,
  chapterNumber: number,
  chapterTitle: string,
  chapterBody: string,
  factSnapshot: {
    newFacts?: string[];
    stateChanges?: string[];
    openHooks?: string[];
    characterMoments?: Record<string, string>;
  } | null
): Promise<void> {
  if (!factSnapshot) return;

  // 读取当前真相文件
  const [currentHooks, currentSummaries, currentArcs] = await Promise.all([
    getTruthFile(novelId, "pending_hooks"),
    getTruthFile(novelId, "chapter_summaries"),
    getTruthFile(novelId, "emotional_arcs"),
  ]);

  // 更新伏笔池
  const updatedHooks = updatePendingHooks(
    currentHooks || "",
    factSnapshot.openHooks || []
  );

  // 追加章节摘要
  const updatedSummaries = appendChapterSummary(
    currentSummaries || "",
    chapterNumber,
    chapterTitle,
    factSnapshot
  );

  // 更新情感弧线
  const updatedArcs = updateEmotionalArcs(
    currentArcs || "",
    factSnapshot.characterMoments || {}
  );

  // 批量写入
  await updateTruthFiles(novelId, {
    pending_hooks: updatedHooks,
    chapter_summaries: updatedSummaries,
    emotional_arcs: updatedArcs,
  });
}

// ============ 上下文构建（注入 prompt 用）===========

/** 构建真相文件上下文（用于注入 AI prompt） */
export function buildTruthFileContext(
  truthFiles: Record<TruthFileType, string>,
  options?: {
    includeTypes?: TruthFileType[];
    maxLength?: number;
  }
): string {
  const types = options?.includeTypes || TRUTH_FILE_TYPES;
  const maxLength = options?.maxLength || 8000;

  const parts: string[] = [];
  let totalLength = 0;

  for (const type of types) {
    const content = truthFiles[type];
    if (!content || content.trim().length === 0) continue;

    const label = TRUTH_FILE_LABELS[type];
    const section = `## ${label}\n${content}`;

    if (totalLength + section.length > maxLength) {
      // 超出长度限制，截断
      const remaining = maxLength - totalLength;
      if (remaining > 100) {
        parts.push(section.slice(0, remaining) + "\n...(已截断)");
      }
      break;
    }

    parts.push(section);
    totalLength += section.length;
  }

  return parts.join("\n\n");
}

// ============ 内部工具函数 ============

function buildInitialState(novel: any): string {
  const parts: string[] = [];

  parts.push(`# 世界状态\n`);
  parts.push(`- 小说：${novel.title}`);
  parts.push(`- 类型：${novel.genre || "未设定"}`);
  parts.push(`- 简介：${novel.synopsis || "未设定"}`);

  if (novel.worldSetting) {
    const ws = novel.worldSetting;
    if (ws.worldType) parts.push(`\n## 世界类型\n${ws.worldType}`);
    if (ws.scale) parts.push(`\n## 世界规模\n${ws.scale}`);
    if (ws.powerSystem) parts.push(`\n## 力量体系\n${ws.powerSystem}`);
    if (ws.geography) parts.push(`\n## 地理架构\n${ws.geography}`);
    if (ws.factions) parts.push(`\n## 势力格局\n${ws.factions}`);
    if (ws.rules) parts.push(`\n## 世界铁律\n${ws.rules}`);
  }

  // 主角初始状态
  const protagonist = novel.characters.find(
    (c: any) => c.role === "protagonist"
  );
  if (protagonist) {
    parts.push(`\n## 主角状态`);
    parts.push(`- 姓名：${protagonist.name}`);
    parts.push(`- 称号：${protagonist.tagline || "无"}`);
    parts.push(`- 性格：${protagonist.personality || "未设定"}`);
    parts.push(`- 欲望：${protagonist.desire || "未设定"}`);
    parts.push(`- 缺陷：${protagonist.flaw || "未设定"}`);
    parts.push(`- 金手指：${protagonist.goldenFinger || "无"}`);
    parts.push(`- 当前位置：故事起点`);
    parts.push(`- 当前状态：初始状态`);
  }

  return parts.join("\n");
}

function buildInitialCharacterMatrix(characters: any[]): string {
  if (characters.length === 0) return "";

  const parts: string[] = [];
  parts.push("# 角色交互矩阵\n");
  parts.push("| 角色 | 角色 | 相遇次数 | 最近相遇 | 关系状态 |");
  parts.push("|------|------|----------|----------|----------|");

  // 初始化所有角色对
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      parts.push(
        `| ${characters[i].name} | ${characters[j].name} | 0 | - | 未相遇 |`
      );
    }
  }

  return parts.join("\n");
}

function buildInitialChapterSummaries(): string {
  const parts: string[] = [];
  parts.push("# 章节摘要\n");
  parts.push(
    "| 章节 | 标题 | 出场人物 | 关键事件 | 状态变化 | 伏笔动态 | 情绪基调 |"
  );
  parts.push(
    "|------|------|----------|----------|----------|----------|----------|"
  );
  return parts.join("\n");
}

function updatePendingHooks(
  current: string,
  newHooks: string[]
): string {
  if (newHooks.length === 0) return current;

  const parts: string[] = current ? [current] : [];
  parts.push("\n## 新增伏笔\n");

  for (const hook of newHooks) {
    if (hook.trim()) {
      parts.push(`- ${hook.trim()}`);
    }
  }

  return parts.join("\n");
}

function appendChapterSummary(
  current: string,
  chapterNumber: number,
  chapterTitle: string,
  factSnapshot: {
    newFacts?: string[];
    stateChanges?: string[];
    openHooks?: string[];
    characterMoments?: Record<string, string>;
  }
): string {
  const characters = factSnapshot.characterMoments
    ? Object.keys(factSnapshot.characterMoments).join("、")
    : "-";
  const events = factSnapshot.newFacts?.slice(0, 3).join("；") || "-";
  const changes = factSnapshot.stateChanges?.slice(0, 2).join("；") || "-";
  const hooks = factSnapshot.openHooks?.slice(0, 2).join("；") || "-";

  const row = `| ${chapterNumber} | ${chapterTitle} | ${characters} | ${events} | ${changes} | ${hooks} | - |`;

  if (!current) {
    return buildInitialChapterSummaries() + "\n" + row;
  }

  return current.trimEnd() + "\n" + row;
}

function updateEmotionalArcs(
  current: string,
  characterMoments: Record<string, string>
): string {
  if (Object.keys(characterMoments).length === 0) return current;

  const parts: string[] = current ? [current] : [];
  parts.push("\n## 情感变化\n");

  for (const [character, moment] of Object.entries(characterMoments)) {
    if (moment.trim()) {
      parts.push(`- **${character}**：${moment.trim()}`);
    }
  }

  return parts.join("\n");
}
