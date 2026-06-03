// AI 痕迹检测系统 — 零 LLM 成本的后写校验

// ============ 禁用词表 ============

/** 高频 AI 词汇 */
export const FATIGUE_WORDS = [
  "缓缓", "淡淡", "微微", "轻轻", "蓦然", "倏忽",
  "仿若", "似是", "不知为何", "莫名", "仿佛",
  "不由得", "不禁", "忍不住", "竟然", "忽然",
  "猛地", "陡然", "骤然", "霍然", "遽然",
];

/** 禁用句式模式 */
export const FORBIDDEN_PATTERNS: Array<{
  pattern: RegExp;
  description: string;
  fix: string;
}> = [
  {
    pattern: /他知道[，,].*[。]/g,
    description: "「他知道，…」总结反思句",
    fix: "删除或改为动作/对话",
  },
  {
    pattern: /这一刻[，,].*[。]/g,
    description: "「这一刻，…」总结反思句",
    fix: "删除或改为具体描写",
  },
  {
    pattern: /从此以后.*[。]/g,
    description: "「从此以后…」总结句",
    fix: "删除，让读者自己体会",
  },
  {
    pattern: /他感到(愤怒|悲伤|高兴|紧张|恐惧|惊讶|厌恶|羞耻|内疚|骄傲|嫉妒|孤独|绝望|希望|平静|焦虑|烦躁|安心|感动|震撼)/g,
    description: "标签化情绪表达",
    fix: "用生理反应+微动作替代",
  },
  {
    pattern: /仿佛.*一般/g,
    description: "「仿佛…一般」比喻句式",
    fix: "换用更具体的比喻或直接描写",
  },
  {
    pattern: /宛如.*似的/g,
    description: "「宛如…似的」比喻句式",
    fix: "换用更具体的比喻或直接描写",
  },
];

/** 禁用开场白 */
export const FORBIDDEN_OPENINGS = [
  "好的，以下是",
  "让我来写",
  "好的，我来",
  "以下是修改后的",
  "这是修改后的",
  "好的，这是",
];

// ============ 检测函数 ============

export interface AITellIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  description: string;
  location?: string;
  fix: string;
}

export interface AITellResult {
  score: number; // 0-100，越低越好
  issues: AITellIssue[];
  passed: boolean;
}

/** 检测 AI 痕迹 */
export function detectAITells(content: string): AITellResult {
  const issues: AITellIssue[] = [];

  // 1. 禁用词检测
  const wordIssues = detectFatigueWords(content);
  issues.push(...wordIssues);

  // 2. 禁用句式检测
  const patternIssues = detectForbiddenPatterns(content);
  issues.push(...patternIssues);

  // 3. 句式单调性检测
  const rhythmIssues = detectSentenceRhythm(content);
  issues.push(...rhythmIssues);

  // 4. 段落等长检测
  const paragraphIssues = detectParagraphUniformity(content);
  issues.push(...paragraphIssues);

  // 5. 章末平稳落地检测
  const endingIssues = detectBoringEnding(content);
  issues.push(...endingIssues);

  // 6. 套话密度检测
  const clicheIssues = detectClicheDensity(content);
  issues.push(...clicheIssues);

  // 计算分数
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  const score = criticalCount * 20 + warningCount * 5 + infoCount * 1;

  return {
    score: Math.min(100, score),
    issues,
    passed: criticalCount === 0 && score < 30,
  };
}

// ============ 具体检测函数 ============

/** 检测高频 AI 词汇 */
function detectFatigueWords(content: string): AITellIssue[] {
  const issues: AITellIssue[] = [];

  for (const word of FATIGUE_WORDS) {
    const regex = new RegExp(word, "g");
    const matches = content.match(regex);

    if (matches && matches.length > 0) {
      // 每 3000 字允许 1 次
      const contentLength = content.length;
      const allowed = Math.max(1, Math.floor(contentLength / 3000));

      if (matches.length > allowed) {
        // 找到位置
        const firstIndex = content.indexOf(word);
        const location = content.slice(
          Math.max(0, firstIndex - 10),
          firstIndex + word.length + 10
        );

        issues.push({
          severity: matches.length > allowed * 2 ? "critical" : "warning",
          category: "ai_vocabulary",
          description: `高频词"${word}"出现 ${matches.length} 次（允许 ${allowed} 次）`,
          location,
          fix: `替换为更具体的表达，减少"${word}"的使用`,
        });
      }
    }
  }

  return issues;
}

/** 检测禁用句式 */
function detectForbiddenPatterns(content: string): AITellIssue[] {
  const issues: AITellIssue[] = [];

  for (const { pattern, description, fix } of FORBIDDEN_PATTERNS) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      const firstIndex = content.search(pattern);
      const location = content.slice(
        Math.max(0, firstIndex - 10),
        firstIndex + 50
      );

      issues.push({
        severity: matches.length > 2 ? "critical" : "warning",
        category: "forbidden_pattern",
        description: `${description}（出现 ${matches.length} 次）`,
        location,
        fix,
      });
    }
  }

  return issues;
}

/** 检测句式单调性 */
function detectSentenceRhythm(content: string): AITellIssue[] {
  const issues: AITellIssue[] = [];

  // 按句号、问号、感叹号分句
  const sentences = content.split(/[。！？!?]+/).filter((s) => s.trim().length > 0);

  if (sentences.length < 5) return issues;

  // 检测连续 3 句以上相同句式
  let consecutiveSame = 1;
  let maxConsecutive = 1;

  for (let i = 1; i < sentences.length; i++) {
    const prevLen = sentences[i - 1].trim().length;
    const currLen = sentences[i].trim().length;

    // 如果长度相近（±20%），认为句式相似
    if (Math.abs(prevLen - currLen) < prevLen * 0.2) {
      consecutiveSame++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveSame);
    } else {
      consecutiveSame = 1;
    }
  }

  if (maxConsecutive >= 5) {
    issues.push({
      severity: "warning",
      category: "sentence_rhythm",
      description: `连续 ${maxConsecutive} 句句式相似，节奏单调`,
      fix: "穿插长短句，打破固定节奏",
    });
  }

  return issues;
}

/** 检测段落等长 */
function detectParagraphUniformity(content: string): AITellIssue[] {
  const issues: AITellIssue[] = [];

  // 按换行分段
  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0)
    .map((p) => p.trim().length);

  if (paragraphs.length < 5) return issues;

  // 计算段落长度标准差
  const avg = paragraphs.reduce((a, b) => a + b, 0) / paragraphs.length;
  const variance =
    paragraphs.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) /
    paragraphs.length;
  const stdDev = Math.sqrt(variance);

  // 如果标准差太小，说明段落等长
  if (stdDev < avg * 0.15 && avg > 50) {
    issues.push({
      severity: "warning",
      category: "paragraph_uniformity",
      description: `段落长度过于均匀（平均 ${Math.round(avg)} 字，标准差 ${Math.round(stdDev)}）`,
      fix: "穿插长短段落，打破固定结构",
    });
  }

  return issues;
}

/** 检测章末平稳落地 */
function detectBoringEnding(content: string): AITellIssue[] {
  const issues: AITellIssue[] = [];

  // 取最后 500 字
  const ending = content.slice(-500);

  // 检查是否有悬念词
  const suspenseWords = [
    "？", "?", "突然", "忽然", "没想到", "意想不到",
    "秘密", "真相", "答案", "悬念", "危机", "危险",
    "决定", "选择", "转折", "变化", "发现", "揭露",
  ];

  const hasSuspense = suspenseWords.some((word) => ending.includes(word));

  // 检查是否有平稳落地特征
  const boringPatterns = [
    /他.*休息了。?$/,
    /她.*睡着了。?$/,
    /他们.*回到了。?$/,
    /一切.*结束了。?$/,
    /故事.*完结了。?$/,
  ];

  const isBoring = boringPatterns.some((pattern) =>
    pattern.test(ending.trim())
  );

  if (isBoring && !hasSuspense) {
    issues.push({
      severity: "warning",
      category: "boring_ending",
      description: "章尾平稳落地，缺乏张力",
      fix: "留下未解决的问题、悬念或新冲突",
    });
  }

  return issues;
}

/** 检测套话密度 */
function detectClicheDensity(content: string): AITellIssue[] {
  const issues: AITellIssue[] = [];

  const cliches = [
    "岁月如梭", "光阴似箭", "不知不觉", "时光飞逝",
    "人生如梦", "世事无常", "命运弄人", "天意如此",
    "冥冥之中", "命中注定", "在劫难逃", "在所难免",
    "众所周知", "毋庸置疑", "毫无疑问", "显而易见",
  ];

  const foundCliches: string[] = [];

  for (const cliche of cliches) {
    if (content.includes(cliche)) {
      foundCliches.push(cliche);
    }
  }

  if (foundCliches.length > 0) {
    // 每 5000 字允许 1 个套话
    const allowed = Math.max(1, Math.floor(content.length / 5000));

    if (foundCliches.length > allowed) {
      issues.push({
        severity: foundCliches.length > allowed * 2 ? "critical" : "warning",
        category: "cliche_density",
        description: `套话过多：${foundCliches.join("、")}（${foundCliches.length} 个，允许 ${allowed} 个）`,
        fix: "删除套话，用具体细节替代",
      });
    }
  }

  return issues;
}

// ============ 自动修复函数 ============

/** 自动修复简单的 AI 痕迹（零 LLM 成本） */
export function autoFixAITells(content: string): {
  fixed: string;
  changes: Array<{ original: string; replacement: string; reason: string }>;
} {
  let fixed = content;
  const changes: Array<{ original: string; replacement: string; reason: string }> = [];

  // 1. 删除禁用开场白
  for (const opening of FORBIDDEN_OPENINGS) {
    if (fixed.startsWith(opening)) {
      const lines = fixed.split("\n");
      // 删除第一行
      fixed = lines.slice(1).join("\n").trim();
      changes.push({
        original: opening,
        replacement: "(删除)",
        reason: "禁用开场白",
      });
    }
  }

  // 2. 替换高频词（简单替换）
  const simpleReplacements: Array<[string, string]> = [
    ["缓缓", "慢慢"],
    ["淡淡", "微微"],
    ["轻轻", "稍稍"],
    ["蓦然", "突然"],
    ["倏忽", "转眼"],
    ["仿若", "好像"],
    ["似是", "像是"],
    ["不知为何", ""],
    ["莫名", ""],
  ];

  for (const [from, to] of simpleReplacements) {
    if (fixed.includes(from)) {
      const regex = new RegExp(from, "g");
      fixed = fixed.replace(regex, to);
      changes.push({
        original: from,
        replacement: to || "(删除)",
        reason: "高频 AI 词汇",
      });
    }
  }

  return { fixed, changes };
}
