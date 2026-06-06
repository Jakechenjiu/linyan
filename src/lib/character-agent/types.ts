// 角色 Agent 类型定义

// ============ 大五人格向量 ============

export interface PersonalityVector {
  openness: number;          // 0-10 开放性：好奇心、想象力、创造力
  conscientiousness: number; // 0-10 尽责性：自律、计划性、责任感
  extraversion: number;      // 0-10 外向性：社交能量、表达欲、活力
  agreeableness: number;     // 0-10 宜人性：合作、同理心、信任
  neuroticism: number;       // 0-10 神经质：情绪波动、焦虑、敏感
}

export const PERSONALITY_DIMENSIONS: Array<keyof PersonalityVector> = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
];

export const PERSONALITY_LABELS: Record<keyof PersonalityVector, { zh: string; en: string }> = {
  openness: { zh: "开放性", en: "Openness" },
  conscientiousness: { zh: "尽责性", en: "Conscientiousness" },
  extraversion: { zh: "外向性", en: "Extraversion" },
  agreeableness: { zh: "宜人性", en: "Agreeableness" },
  neuroticism: { zh: "神经质", en: "Neuroticism" },
};

// ============ 语言指纹 ============

export interface LanguageFingerprint {
  avgSentenceLength: number;     // 平均句长
  vocabComplexity: "simple" | "moderate" | "complex";
  dialectMarkers: string[];      // 方言标记
  forbiddenWords: string[];      // 此角色绝不使用的词
  signaturePhrases: string[];    // 口头禅/标志性表达
  punctuationStyle: string;      // 标点偏好
  narrativeVoice: string;        // 叙事声音描述
}

export const DEFAULT_FINGERPRINT: LanguageFingerprint = {
  avgSentenceLength: 20,
  vocabComplexity: "moderate",
  dialectMarkers: [],
  forbiddenWords: [],
  signaturePhrases: [],
  punctuationStyle: "standard",
  narrativeVoice: "",
};

// ============ 角色状态 ============

export interface CharacterAgentState {
  location: string;
  emotionalState: string;
  primaryMotivation: string;
  activeFear: string;
  energyLevel: number;           // 0-10
  relationshipChanges: Record<string, string>; // 角色名 -> 关系变化描述
}

export const DEFAULT_STATE: CharacterAgentState = {
  location: "",
  emotionalState: "平静",
  primaryMotivation: "",
  activeFear: "",
  energyLevel: 5,
  relationshipChanges: {},
};

// ============ 行为约束 ============

export interface BehaviorConstraints {
  hardLimits: string[];          // 绝对不做
  softLimits: string[];          // 尽量不做
  triggers: string[];            // 触发强烈反应的刺激
  speechPatterns: {
    formality: number;           // 0-10 正式度
    verbosity: number;           // 0-10 话多程度
    humor: number;               // 0-10 幽默度
  };
}

export const DEFAULT_CONSTRAINTS: BehaviorConstraints = {
  hardLimits: [],
  softLimits: [],
  triggers: [],
  speechPatterns: {
    formality: 5,
    verbosity: 5,
    humor: 5,
  },
};

// ============ 记忆系统 ============

export interface CharacterMemoryEntry {
  id: string;
  characterId: string;
  type: "experience" | "observation" | "emotion" | "knowledge";
  content: string;
  importance: number;            // 0-1
  emotionTag?: string;
  tags: string[];
  chapterId?: string;
  createdAt: string;
}

// ============ 信息边界 ============

export interface CharacterKnowledgeEntry {
  id: string;
  characterId: string;
  type: "event" | "secret" | "relationship" | "world_fact";
  content: string;
  source?: string;
  acquiredAt?: string;
  isSecret: boolean;
  createdAt: string;
}

// ============ 角色 Agent 完整数据 ============

export interface CharacterAgentData {
  // 身份
  id: string;
  name: string;
  role: string;
  tagline?: string;
  appearance?: string;

  // 静态设定（向后兼容）
  personalityText?: string;
  desire?: string;
  flaw?: string;
  wound?: string;
  need?: string;
  change?: string;
  goldenFinger?: string;

  // 动态 Agent 数据
  personality: PersonalityVector | null;
  languageFingerprint: LanguageFingerprint;
  agentState: CharacterAgentState;
  behaviorConstraints: BehaviorConstraints;
  memories: CharacterMemoryEntry[];
  knowledge: CharacterKnowledgeEntry[];
}

// ============ 行为预测 ============

export interface BehaviorTendency {
  action: string;
  confidence: number;  // 0-1
  reasoning: string;   // 基于哪个性格维度
}

// ============ 编辑部类型 ============

export type ReviewerRole = "author" | "editor" | "chief" | "reader" | "continuity";

export interface ReviewerAssessment {
  role: ReviewerRole;
  score: number;                 // 0-100
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  verdict: "approve" | "reject" | "conditional";
  reasoning: string;
}

export interface DebateEntry {
  speaker: ReviewerRole;
  target: ReviewerRole | "all";
  point: string;
  type: "agree" | "disagree" | "challenge" | "support";
}

export interface EditorialResult {
  assessments: Record<ReviewerRole, ReviewerAssessment>;
  debate: DebateEntry[];
  votes: {
    approve: ReviewerRole[];
    reject: ReviewerRole[];
    conditional: ReviewerRole[];
  };
  finalDecision: "approve" | "reject" | "conditional";
  chiefRuling: string;
}

// ============ 情感曲线类型 ============

export interface EmotionalDataPoint {
  position: number;    // 0-100，文本位置百分比
  tension: number;     // 0-10
  suspense: number;    // 0-10
  pleasure: number;    // 0-10
  sadness: number;     // 0-10
  reversal: number;    // 0-10
}

export interface NarrativeTechnique {
  segment: [number, number]; // [start%, end%]
  technique: string;
  reason: string;
  expectedEffect: string;
}

export interface EmotionalCurveDesign {
  targetCurve: EmotionalDataPoint[];
  techniques: NarrativeTechnique[];
  overallTone: string;
  pacingStrategy: string;
}

export interface CurveValidation {
  tensionMatch: number;
  suspenseMatch: number;
  pleasureMatch: number;
  sadnessMatch: number;
  reversalMatch: number;
  overallMatch: number;
}
