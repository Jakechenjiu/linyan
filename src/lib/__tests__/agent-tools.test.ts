import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma — pipeline.ts 间接导入了 db.ts
vi.mock('@/lib/db', () => ({
  prisma: {
    novel: { findUnique: vi.fn() },
    chapter: { create: vi.fn(), findMany: vi.fn() },
    writingLog: { upsert: vi.fn() },
    emotionalCurve: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/ai', () => ({
  getAiConfig: vi.fn().mockResolvedValue({ hasKey: true, apiKey: 'test', baseUrl: 'http://test', model: 'test', provider: 'test' }),
  callAi: vi.fn().mockResolvedValue('{}'),
  callAiStream: vi.fn(),
  callAiWithTools: vi.fn(),
}))

vi.mock('@/lib/cache', () => ({
  getCachedTruthFiles: vi.fn().mockResolvedValue({}),
  invalidateTruthFileCache: vi.fn(),
}))

vi.mock('@/lib/character-agent/context-builder', () => ({
  buildMultiCharacterContext: vi.fn().mockResolvedValue(''),
  loadCharacterAgent: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/character-agent/knowledge', () => ({
  doesCharacterKnow: vi.fn().mockResolvedValue(false),
}))

import { shouldTriggerPipeline, extractOutlineId } from '../agent-tools/pipeline'

// pipeline.ts 的纯函数可以直接测试

describe('shouldTriggerPipeline', () => {
  it('检测"写第一章"', () => {
    expect(shouldTriggerPipeline('写第一章')).toBe(true)
  })

  it('检测"续写"', () => {
    expect(shouldTriggerPipeline('续写')).toBe(true)
  })

  it('检测"生成章节"', () => {
    expect(shouldTriggerPipeline('帮我生成章节')).toBe(true)
  })

  it('检测"下一章"', () => {
    expect(shouldTriggerPipeline('下一章')).toBe(true)
  })

  it('不触发普通对话', () => {
    expect(shouldTriggerPipeline('这个角色的动机是什么')).toBe(false)
  })

  it('不触发"帮我改这段"', () => {
    expect(shouldTriggerPipeline('帮我改这段文字')).toBe(false)
  })
})

describe('extractOutlineId', () => {
  // 注意：extractOutlineId 的正则 /第(\d+)章/ 只匹配阿拉伯数字
  // 标题匹配用 message.includes(outline.title)，所以 message 必须包含完整标题
  const outlines = [
    { id: 'vol-1', title: '第1卷起源' },
    { id: 'ch-1', title: '第1章觉醒' },
    { id: 'ch-2', title: '第2章踏上旅途' },
    { id: 'ch-3', title: '第3章遭遇' },
  ]

  it('从"写第3章"提取大纲 ID', () => {
    const result = extractOutlineId('写第3章', outlines)
    expect(result).toBe('ch-3')
  })

  it('从"帮我写第1章"提取大纲 ID — 优先匹配 chapter', () => {
    const result = extractOutlineId('帮我写第1章', outlines)
    expect(result).toBe('ch-1')
  })

  it('匹配大纲标题（完整包含）', () => {
    const result = extractOutlineId('写第1卷起源', outlines)
    expect(result).toBe('vol-1')
  })

  it('无匹配返回 null', () => {
    const result = extractOutlineId('随便聊聊', outlines)
    expect(result).toBeNull()
  })

  it('空大纲列表返回 null', () => {
    const result = extractOutlineId('写第1章', [])
    expect(result).toBeNull()
  })
})
