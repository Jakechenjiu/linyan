// 审计维度定义 — 参考 InkOS 的 33 维度，提取核心维度

export interface AuditDimension {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "warning" | "info";
  promptHint: string;
}

// 核心审计维度（从 10 扩展到 20）
export const AUDIT_DIMENSIONS: AuditDimension[] = [
  // === 原有 10 维度（增强）===
  {
    id: "significance_inflation",
    name: "意义膨胀",
    description: "过度使用"标志着"、"象征着"、"反映着"等抽象归因",
    severity: "warning",
    promptHint: "检查是否有"标志着""象征着""反映着""意味着"等过度升华",
  },
  {
    id: "tricolon",
    name: "三段式排比",
    description: "X、Y、Z结构的机械排比",
    severity: "warning",
    promptHint: "检查是否有三段式排比（A、B、C 或 A；B；C）",
  },
  {
    id: "paragraph_arc",
    name: "段落弧度雷同",
    description: "每段都是主题句→展开→总结的固定结构",
    severity: "warning",
    promptHint: "检查段落结构是否千篇一律（主题句→展开→总结）",
  },
  {
    id: "ai_vocabulary",
    name: "AI高频词汇",
    description: "缓缓/淡淡/微微/轻轻/蓦然等万用副词",
    severity: "critical",
    promptHint: "检查是否使用了：缓缓、淡淡、微微、轻轻、蓦然、倏忽、仿若、似是、不知为何、莫名、仿佛",
  },
  {
    id: "vague_attribution",
    name: "模糊归因",
    description: "专家认为/研究表明等无来源归因",
    severity: "warning",
    promptHint: "检查是否有"专家认为""研究表明""众所周知"等模糊归因",
  },
  {
    id: "dialogue_completeness",
    name: "对话完整性",
    description: "信息广播式对话，缺乏潜台词",
    severity: "warning",
    promptHint: "检查对话是否像信息播报（角色直接说出所有信息，没有潜台词、意图冲突、打断、沉默）",
  },
  {
    id: "concrete_anchors",
    name: "具体锚点",
    description: "缺少专有名词/数字/感官细节",
    severity: "warning",
    promptHint: "检查是否缺乏具体细节（专有名词、数字、感官描写）",
  },
  {
    id: "sentence_rhythm",
    name: "句式节奏",
    description: "缺乏长短句交替",
    severity: "warning",
    promptHint: "检查句式是否单调（连续3句以上相同句式、缺乏长短句交替）",
  },
  {
    id: "emotional_labeling",
    name: "情感标签化",
    description: "直接说"他感到悲伤"而非用身体反应表达",
    severity: "critical",
    promptHint: "检查是否有"他感到X"（愤怒/悲伤/高兴等）的标签化表达，应该用生理反应+微动作替代",
  },
  {
    id: "structural_regularity",
    name: "结构规律性",
    description: "过于整洁的结构，无不规则性",
    severity: "warning",
    promptHint: "检查结构是否过于工整（起因→经过→结果→感悟四段式闭合）",
  },

  // === 新增 10 维度（参考 InkOS）===
  {
    id: "character_consistency",
    name: "角色一致性（OOC）",
    description: "角色行为是否符合已设定的人格、欲望、缺陷",
    severity: "critical",
    promptHint: "检查角色行为是否违背其设定（性格、欲望、缺陷、金手指）。特别关注：主角是否突然变聪明/变笨？反派是否突然变善良？",
  },
  {
    id: "timeline_check",
    name: "时间线检查",
    description: "时间顺序是否合理",
    severity: "critical",
    promptHint: "检查时间线是否有矛盾（昨天刚发生的事今天又发生？角色同时出现在两个地方？）",
  },
  {
    id: "lore_conflict",
    name: "设定冲突",
    description: "是否违反世界观规则、力量体系",
    severity: "critical",
    promptHint: "检查是否违反世界观铁律和力量体系（如：低阶角色突然使用高阶技能？已死的角色复活？）",
  },
  {
    id: "power_scaling",
    name: "战力崩坏",
    description: "力量等级是否前后一致",
    severity: "critical",
    promptHint: "检查战力是否崩坏（前期打不过的小兵后期轻松秒杀？主角实力跳跃式增长无铺垫？）",
  },
  {
    id: "hook_check",
    name: "伏笔检查",
    description: "伏笔是否被遗忘或过早揭示",
    severity: "warning",
    promptHint: "检查伏笔管理：是否有伏笔被遗忘？是否有伏笔过早揭示？是否有新伏笔无铺垫？",
  },
  {
    id: "lexical_fatigue",
    name: "词汇疲劳",
    description: "高频词重复使用",
    severity: "warning",
    promptHint: "检查词汇疲劳：是否有某个词在短时间内重复出现3次以上？（如：连续使用"不由得""不禁""忍不住"）",
  },
  {
    id: "pacing_check",
    name: "节奏检查",
    description: "节奏是否单调或失控",
    severity: "warning",
    promptHint: "检查节奏：是否有流水账感？爽点/信息/情感交付密度如何？连续5章无高潮标记为节奏停滞",
  },
  {
    id: "info_boundary",
    name: "信息越界",
    description: "角色知道不该知道的信息",
    severity: "critical",
    promptHint: "检查信息边界：角色是否知道了他不该知道的事？（如：未亲眼见过的事被提及、未来信息泄露）",
  },
  {
    id: "cliche_density",
    name: "套话密度",
    description: "陈词滥调和公式化表达",
    severity: "warning",
    promptHint: "检查套话：是否有"岁月如梭""光阴似箭""不知不觉"等陈词滥调？",
  },
  {
    id: "ending_check",
    name: "章末检查",
    description: "章尾是否平稳落地，缺乏张力",
    severity: "warning",
    promptHint: "检查章尾：是否平稳落地（主角安全休息）？应该留下未解决的张力、悬念或新问题",
  },
];

// 构建审计 prompt
export function buildAuditPrompt(dimensions: AuditDimension[]): string {
  const dimensionList = dimensions
    .map(
      (d, i) =>
        `${i + 1}. **${d.name}** (${d.id}): ${d.description}
   检查要点: ${d.promptHint}`
    )
    .join("\n\n");

  return `你是一位资深文学编辑和AIGC检测专家。请对以下文本进行${dimensions.length}维度审计。

审计维度（每项0-10分，0=无问题，10=严重问题）：

${dimensionList}

请严格按以下JSON格式输出，不要输出其他内容：
{
  "overallScore": 0-100,
  "passed": true/false,
  "dimensions": {
${dimensions.map((d) => `    "${d.id}": 0-10`).join(",\n")}
  },
  "issues": [
    {
      "severity": "critical" | "warning" | "info",
      "dimension": "维度id",
      "line": "问题所在段落的前几个字",
      "text": "问题原文",
      "problem": "问题描述",
      "fix": "修改建议"
    }
  ],
  "summary": "整体评价（1-2句话）"
}

评分标准：
- overallScore = 所有维度分数之和（满分${dimensions.length * 10}）
- passed = true 当且仅当没有 critical 问题且 overallScore < ${dimensions.length * 5}
- severity 判定：
  - critical: 严重破坏故事逻辑、角色一致性、世界观的问题
  - warning: 影响阅读体验但不破坏故事的问题
  - info: 轻微问题，可改可不改`;
}

// 构建修订 prompt
export function buildRevisionPrompt(
  issues: Array<{
    severity: string;
    dimension: string;
    line?: string;
    text?: string;
    problem: string;
    fix: string;
  }>,
  language: "zh" | "en" = "zh"
): string {
  const issueList = issues
    .map(
      (issue, i) =>
        `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.dimension}
   问题: ${issue.problem}
   ${issue.text ? `原文: "${issue.text}"` : ""}
   修改建议: ${issue.fix}`
    )
    .join("\n\n");

  if (language === "en") {
    return `You are a professional novel editor. Please revise the following chapter to fix the issues listed below.

## Issues to Fix
${issueList}

## Revision Rules
1. Fix ALL critical and warning issues
2. Do NOT change the plot, character development, or story direction
3. Do NOT add new plot points or characters
4. Maintain the original writing style and tone
5. Keep the same approximate word count (±10%)
6. Output ONLY the revised chapter text, no explanations

## Original Chapter
{chapterContent}

Please output the revised chapter:`;
  }

  return `你是一位专业的网文编辑。请修订以下章节，修复下面列出的问题。

## 需要修复的问题
${issueList}

## 修订规则
1. 修复所有 critical 和 warning 级别的问题
2. 不要改变剧情、角色发展或故事方向
3. 不要添加新的剧情点或角色
4. 保持原文的写作风格和语调
5. 保持相近的字数（±10%）
6. 只输出修订后的正文，不要解释

## 原始章节
{chapterContent}

请输出修订后的章节：`;
}

// 判断是否需要修订
export function shouldRevive(
  auditResult: {
    passed: boolean;
    overallScore: number;
    issues: Array<{ severity: string }>;
  },
  maxRetries: number = 2,
  currentRetry: number = 0
): { shouldRevise: boolean; reason?: string } {
  // 已通过，不需要修订
  if (auditResult.passed) {
    return { shouldRevise: false };
  }

  // 超过最大重试次数
  if (currentRetry >= maxRetries) {
    return {
      shouldRevise: false,
      reason: `已达到最大修订次数（${maxRetries}次），保留当前版本`,
    };
  }

  // 有 critical 问题，必须修订
  const criticalIssues = auditResult.issues.filter(
    (i) => i.severity === "critical"
  );
  if (criticalIssues.length > 0) {
    return {
      shouldRevise: true,
      reason: `有 ${criticalIssues.length} 个严重问题需要修复`,
    };
  }

  // 分数太高，需要修订
  if (auditResult.overallScore > 100) {
    return {
      shouldRevise: true,
      reason: `审计分数过高（${auditResult.overallScore}分）`,
    };
  }

  return { shouldRevise: false, reason: "问题不严重，保留当前版本" };
}
