// 审计根因分析 — 分析问题为什么会发生，给出针对性修复建议

interface AuditIssue {
  severity: string;
  category: string;
  dimension?: string;
  description: string;
  problem?: string;
  fix?: string;
}

interface RootCauseAnalysis {
  issue: AuditIssue;
  rootCause: string;
  preventionRule: string;
  fixStrategy: string;
}

/**
 * 对审计问题进行根因分析
 */
export function analyzeRootCauses(
  issues: AuditIssue[],
  chapterBody: string,
  recentChapters: string[] = []
): RootCauseAnalysis[] {
  return issues
    .filter((i) => i.severity === "critical" || i.severity === "warning")
    .map((issue) => analyzeSingleIssue(issue, chapterBody, recentChapters));
}

function analyzeSingleIssue(
  issue: AuditIssue,
  chapterBody: string,
  recentChapters: string[]
): RootCauseAnalysis {
  const category = issue.category || issue.dimension || "";

  switch (category) {
    case "ai_vocabulary":
      return analyzeAIVocabulary(issue, chapterBody);
    case "emotional_labeling":
      return analyzeEmotionalLabeling(issue, chapterBody);
    case "dialogue_completeness":
      return analyzeDialogueCompleteness(issue, chapterBody);
    case "character_consistency":
      return analyzeCharacterConsistency(issue, chapterBody, recentChapters);
    case "pacing_check":
      return analyzePacing(issue, chapterBody, recentChapters);
    case "sentence_rhythm":
      return analyzeSentenceRhythm(issue, chapterBody);
    case "structural_regularity":
      return analyzeStructuralRegularity(issue, chapterBody);
    case "cliche_density":
      return analyzeClicheDensity(issue, chapterBody);
    case "lexical_fatigue":
      return analyzeLexicalFatigue(issue, chapterBody);
    case "ending_check":
      return analyzeEnding(issue, chapterBody);
    default:
      return {
        issue,
        rootCause: "未识别的根因",
        preventionRule: "需要人工分析",
        fixStrategy: issue.fix || "按通用修复建议处理",
      };
  }
}

function analyzeAIVocabulary(issue: AuditIssue, body: string): RootCauseAnalysis {
  // 找出具体是哪些 AI 词汇
  const aiWords = ["缓缓", "淡淡", "微微", "轻轻", "蓦然", "倏忽", "仿若", "仿佛", "不知为何", "莫名"];
  const foundWords = aiWords.filter((w) => body.includes(w));

  return {
    issue,
    rootCause: `prompt 中的禁用词表没有完全覆盖这些词汇，或者 LLM 在生成时忽略了约束。发现的 AI 词汇：${foundWords.join("、")}`,
    preventionRule: "在 Writer prompt 中加强禁用词约束，使用'绝对不能使用'而非'避免使用'",
    fixStrategy: `逐个替换：${foundWords.map((w) => `"${w}"→替换为具体动作或感官描写`).join("；")}`,
  };
}

function analyzeEmotionalLabeling(issue: AuditIssue, body: string): RootCauseAnalysis {
  // 找出具体的标签化表达
  const labelPattern = /他感到(愤怒|悲伤|高兴|紧张|恐惧|惊讶|厌恶|羞耻|内疚|骄傲|嫉妒|孤独|绝望|希望|平静|焦虑|烦躁|安心|感动|震撼)/g;
  const labels: string[] = [];
  let match;
  while ((match = labelPattern.exec(body)) !== null) {
    labels.push(match[0]);
  }

  return {
    issue,
    rootCause: `LLM 倾向于直接描述情绪而非通过行为展示。这是 LLM 的'偷懒'模式——用抽象标签替代具体描写。发现：${labels.join("、")}`,
    preventionRule: "在 prompt 中明确要求'禁止使用感到X的句式，必须通过生理反应、微动作、环境暗示来表达情绪'",
    fixStrategy: labels.map((l) => {
      const emotion = l.replace("他感到", "");
      return `"${l}"→用具体表现替代（如：拳头握紧、呼吸急促、眼眶发红）`;
    }).join("；"),
  };
}

function analyzeDialogueCompleteness(issue: AuditIssue, body: string): RootCauseAnalysis {
  return {
    issue,
    rootCause: "对话像信息播报——角色直接说出所有信息，没有潜台词、意图冲突、打断、沉默。LLM 倾向于'说清楚'而非'暗示'",
    preventionRule: "在 prompt 中要求'对话必须有潜台词，角色不会直接说出自己的真实意图'",
    fixStrategy: "给每段对话添加：1)角色的真实目的 2)不想让对方知道的信息 3)对话中的权力关系",
  };
}

function analyzeCharacterConsistency(
  issue: AuditIssue,
  body: string,
  recentChapters: string[]
): RootCauseAnalysis {
  return {
    issue,
    rootCause: "LLM 在长文本生成中容易'忘记'角色设定，特别是当上下文太长时。角色的性格、欲望、缺陷可能被忽略",
    preventionRule: "每次生成时在 prompt 开头重复核心角色设定（性格、欲望、缺陷），不要依赖 LLM 的'记忆'",
    fixStrategy: "1)检查角色行为是否符合设定 2)如果需要偏离，必须有铺垫和理由 3)在修订时对照角色设定逐句检查",
  };
}

function analyzePacing(
  issue: AuditIssue,
  body: string,
  recentChapters: string[]
): RootCauseAnalysis {
  return {
    issue,
    rootCause: "缺少'蓄压→爆发→后效'的节奏周期。可能是连续铺垫无高潮，或连续高潮无喘息",
    preventionRule: "在 Plan 阶段明确本章在节奏周期中的位置（铺垫/升级/高潮/后效），避免连续 3 章同类型",
    fixStrategy: "1)如果是铺垫过多：在本章末尾加入小爆发或悬念 2)如果是高潮过多：加入角色反思或关系变化作为喘息",
  };
}

function analyzeSentenceRhythm(issue: AuditIssue, body: string): RootCauseAnalysis {
  return {
    issue,
    rootCause: "句式长度过于均匀，缺乏长短句交替。LLM 倾向于生成中等长度的句子",
    preventionRule: "在 prompt 中要求'穿插短句（5-10字）和长句（30-50字），不要连续 3 句以上相同句式'",
    fixStrategy: "在修订时：1)把长句拆成短句 2)在短句后接一个长描写 3)对话和叙述交替",
  };
}

function analyzeStructuralRegularity(issue: AuditIssue, body: string): RootCauseAnalysis {
  return {
    issue,
    rootCause: "段落结构过于规律（主题句→展开→总结），像教科书而非小说。LLM 的默认写作模式就是这种三段式",
    preventionRule: "在 prompt 中要求'段落结构要多变，有些段落直接切入，有些段落以对话开头，有些段落只有动作'",
    fixStrategy: "打破规律：1)删除段落结尾的总结句 2)用动作或对话开头 3)故意制造不规则的段落长度",
  };
}

function analyzeClicheDensity(issue: AuditIssue, body: string): RootCauseAnalysis {
  const cliches = ["岁月如梭", "光阴似箭", "不知不觉", "时光飞逝", "命运弄人", "冥冥之中"];
  const found = cliches.filter((c) => body.includes(c));

  return {
    issue,
    rootCause: `LLM 训练数据中包含大量套路化表达，生成时会自然输出。发现：${found.join("、")}`,
    preventionRule: "在 prompt 中列出禁用套话清单，要求'用具体细节替代抽象感慨'",
    fixStrategy: found.map((c) => `"${c}"→删除或用具体场景替代`).join("；"),
  };
}

function analyzeLexicalFatigue(issue: AuditIssue, body: string): RootCauseAnalysis {
  return {
    issue,
    rootCause: "LLM 有'偏好词汇'，会反复使用相同的词。这是 LLM 的概率采样特性导致的",
    preventionRule: "在 prompt 中要求'避免重复使用同一个词，每 3000 字内同一个词不超过 1 次'",
    fixStrategy: "1)用同义词替换 2)用具体动作替代抽象词 3)用感官描写替代情绪词",
  };
}

function analyzeEnding(issue: AuditIssue, body: string): RootCauseAnalysis {
  return {
    issue,
    rootCause: "LLM 倾向于'圆满收尾'——总结本章、展望未来、角色感到满足。这是训练数据中的'好作文'模式",
    preventionRule: "在 prompt 中明确要求'章尾必须留下未解决的张力，禁止平稳落地'",
    fixStrategy: "在章尾添加：1)新出现的威胁 2)角色的犹豫或不安 3)未回答的问题 4)突发事件的暗示",
  };
}

/**
 * 将根因分析格式化为 prompt 注入文本
 */
export function formatRootCauseForPrompt(analyses: RootCauseAnalysis[]): string {
  if (analyses.length === 0) return "";

  return analyses
    .map(
      (a) => `### ${a.issue.category || a.issue.dimension}
根因：${a.rootCause}
修复策略：${a.fixStrategy}`
    )
    .join("\n\n");
}
