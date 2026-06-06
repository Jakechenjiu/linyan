// 智能上下文筛选 — 根据章节意图选择相关真相文件内容

/**
 * 从真相文件中筛选与当前章节相关的内容
 */
export function filterRelevantContext(
  truthFiles: Record<string, string>,
  params: {
    chapterGoal: string;
    characterFocus?: string;
    recentChapters: string[];
    keywords?: string[];
  }
): Record<string, string> {
  const result: Record<string, string> = {};

  // 提取关键词
  const allKeywords = [
    ...(params.keywords || []),
    ...(params.characterFocus ? [params.characterFocus] : []),
    ...extractKeywordsFromGoal(params.chapterGoal),
  ];

  // 世界状态 — 只保留最近的变化
  if (truthFiles.current_state) {
    result.current_state = filterCurrentState(truthFiles.current_state, allKeywords);
  }

  // 伏笔池 — 只保留开放状态的伏笔
  if (truthFiles.pending_hooks) {
    result.pending_hooks = filterOpenHooks(truthFiles.pending_hooks, allKeywords);
  }

  // 章节摘要 — 只保留最近 5 章 + 与当前相关的
  if (truthFiles.chapter_summaries) {
    result.chapter_summaries = filterRecentSummaries(
      truthFiles.chapter_summaries,
      allKeywords,
      5
    );
  }

  // 角色矩阵 — 只保留焦点角色的交互
  if (truthFiles.character_matrix && params.characterFocus) {
    result.character_matrix = filterCharacterMatrix(
      truthFiles.character_matrix,
      params.characterFocus
    );
  }

  // 情感弧线 — 只保留焦点角色的
  if (truthFiles.emotional_arcs && params.characterFocus) {
    result.emotional_arcs = filterByCharacter(
      truthFiles.emotional_arcs,
      params.characterFocus
    );
  }

  // 资源账本 — 全量保留（通常不长）
  if (truthFiles.particle_ledger) {
    result.particle_ledger = truthFiles.particle_ledger;
  }

  // 支线进度板 — 全量保留
  if (truthFiles.subplot_board) {
    result.subplot_board = truthFiles.subplot_board;
  }

  return result;
}

/**
 * 从目标中提取关键词
 */
function extractKeywordsFromGoal(goal: string): string[] {
  const keywords: string[] = [];

  // 提取中文名字（2-4字）
  const nameRegex = /[一-鿿]{2,4}/g;
  let match;
  while ((match = nameRegex.exec(goal)) !== null) {
    keywords.push(match[0]);
  }

  return [...new Set(keywords)];
}

/**
 * 筛选世界状态 — 只保留与关键词相关的行
 */
function filterCurrentState(state: string, keywords: string[]): string {
  if (keywords.length === 0) return state.slice(0, 3000);

  const lines = state.split("\n");
  const relevantLines: string[] = [];
  let currentSection = "";

  for (const line of lines) {
    // 保留标题行
    if (line.startsWith("#") || line.startsWith("##")) {
      currentSection = line;
      relevantLines.push(line);
      continue;
    }

    // 检查是否与关键词相关
    const isRelevant = keywords.some((kw) => line.includes(kw));
    if (isRelevant) {
      // 确保 section 标题也被保留
      if (relevantLines.length === 0 || !relevantLines[relevantLines.length - 1].startsWith("#")) {
        relevantLines.push(currentSection);
      }
      relevantLines.push(line);
    }
  }

  const filtered = relevantLines.join("\n").trim();
  return filtered.length > 0 ? filtered : state.slice(0, 2000);
}

/**
 * 筛选开放状态的伏笔
 */
function filterOpenHooks(hooks: string, keywords: string[]): string {
  const lines = hooks.split("\n");
  const relevantLines: string[] = [];

  for (const line of lines) {
    // 保留标题行
    if (line.startsWith("#") || line.startsWith("##")) {
      relevantLines.push(line);
      continue;
    }

    // 保留开放状态的伏笔（未标记为"已回收"）
    const isOpen = !line.includes("已回收") && !line.includes("已解决") && !line.includes("resolved");
    if (isOpen) {
      // 如果有关键词，只保留相关的
      if (keywords.length === 0) {
        relevantLines.push(line);
      } else {
        const isRelevant = keywords.some((kw) => line.includes(kw));
        if (isRelevant) {
          relevantLines.push(line);
        }
      }
    }
  }

  return relevantLines.join("\n").trim();
}

/**
 * 筛选最近 N 章的摘要 + 与关键词相关的
 */
function filterRecentSummaries(
  summaries: string,
  keywords: string[],
  recentCount: number
): string {
  const lines = summaries.split("\n");
  const headerLines: string[] = [];
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("| 章节") || line.startsWith("| Chapter") || line.startsWith("|---")) {
      headerLines.push(line);
    } else if (line.startsWith("|")) {
      dataLines.push(line);
    }
  }

  // 取最近 N 章
  const recentLines = dataLines.slice(-recentCount);

  // 找与关键词相关的其他章节
  const relevantOldLines = dataLines
    .slice(0, -recentCount)
    .filter((line) => keywords.some((kw) => line.includes(kw)));

  return [...headerLines, ...relevantOldLines, ...recentLines].join("\n");
}

/**
 * 筛选角色矩阵 — 只保留焦点角色的交互
 */
function filterCharacterMatrix(matrix: string, focusCharacter: string): string {
  const lines = matrix.split("\n");
  const relevantLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("| 角色") || line.startsWith("|---")) {
      relevantLines.push(line);
    } else if (line.includes(focusCharacter)) {
      relevantLines.push(line);
    }
  }

  return relevantLines.join("\n").trim();
}

/**
 * 按角色筛选内容
 */
function filterByCharacter(content: string, character: string): string {
  const lines = content.split("\n");
  const relevantLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("##")) {
      relevantLines.push(line);
    } else if (line.includes(character)) {
      relevantLines.push(line);
    }
  }

  return relevantLines.join("\n").trim();
}
