// JSON 字段类型定义 — 不改 schema，用 TypeScript 接口约束读写

/** Character.languageFingerprint 的结构 */
export interface LanguageFingerprint {
  avgSentenceLength?: number
  vocabComplexity?: 'simple' | 'moderate' | 'complex'
  dialectMarkers?: string[]
  forbiddenWords?: string[]
  signaturePhrases?: string[]
  punctuationStyle?: string
  narrativeVoice?: string
}

/** Character.agentState 的结构 */
export interface AgentState {
  location?: string
  emotionalState?: string
  primaryMotivation?: string
  activeFear?: string
  energyLevel?: number
}

/** Character.behaviorConstraints 的结构 */
export interface BehaviorConstraints {
  hardLimits?: string[]
  softLimits?: string[]
  triggers?: string[]
  speechPatterns?: {
    formality?: 'casual' | 'neutral' | 'formal'
    verbosity?: 'terse' | 'normal' | 'verbose'
    humor?: 'none' | 'dry' | 'frequent'
  }
}

/** Character.relationships 的结构 */
export interface CharacterRelationships {
  [characterName: string]: {
    relation: string
    sentiment?: 'positive' | 'negative' | 'neutral' | 'complex'
    notes?: string
  }
}

/** Chapter.factSnapshot 的结构 */
export interface FactSnapshot {
  newFacts?: string[]
  stateChanges?: string[]
  openHooks?: string[]
  characterMoments?: Record<string, string>
}

/** EditorialReview 各角色评审的结构 */
export interface ReviewContent {
  score?: number
  issues?: Array<{
    severity: 'critical' | 'warning' | 'info'
    category: string
    description: string
    suggestion?: string
  }>
  summary?: string
}

/** Simulation.result 的结构 */
export interface SimulationResult {
  summary?: string
  report?: string
  rounds?: Array<{
    round: number
    agentOutputs: Record<string, string>
  }>
  agents?: Array<{
    name: string
    role: string
    personality?: string
  }>
}

/** 安全解析 JSON 字段，失败返回 fallback */
export function parseJsonField<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** 安全序列化 JSON 字段 */
export function serializeJsonField<T>(value: T): string {
  try {
    return JSON.stringify(value)
  } catch {
    return '{}'
  }
}
