import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma 和 ai 模块
vi.mock('@/lib/db', () => ({
  prisma: {
    novel: { findUnique: vi.fn() },
    outline: { findUnique: vi.fn() },
    character: { findMany: vi.fn() },
    truthFile: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/ai', () => ({
  getAiConfig: vi.fn().mockResolvedValue({ hasKey: true, apiKey: 'test', baseUrl: 'http://test', model: 'test', provider: 'test' }),
  callAi: vi.fn().mockResolvedValue('{"goal":"测试目标","mustKeep":["保持一致性"],"mustAvoid":["避免AI味"],"endState":"留下悬念","openingMandate":"延续上文","characterFocus":"主角"}'),
}))

vi.mock('@/lib/cache', () => ({
  getCachedTruthFiles: vi.fn().mockResolvedValue({
    current_state: '世界状态',
    particle_ledger: '',
    pending_hooks: '',
    chapter_summaries: '',
    subplot_board: '',
    emotional_arcs: '',
    character_matrix: '',
  }),
}))

import { buildGovernanceContext } from '../input-governance'
import type { ChapterIntent, ContextPackage, RuleStack } from '../input-governance'

describe('buildRuleStack', () => {
  it('硬护栏包含 mustKeep 元素', () => {
    const intent: ChapterIntent = {
      goal: '测试',
      mustKeep: ['保持角色一致性', '遵守世界铁律'],
      mustAvoid: ['避免AI味'],
      endState: '留下悬念',
    }

    // buildRuleStack 是内部函数，通过 buildGovernanceContext 间接测试
    // 或者直接导入（如果导出了）
    // 这里测试 buildGovernanceContext 的输出
    const composed: ContextPackage = {
      selectedContext: '测试上下文',
      ruleStack: {
        hard: ['保持角色一致性', '遵守世界铁律', '不使用禁用词汇'],
        soft: ['保持叙事风格', '对话有潜台词'],
        diagnostic: ['检查角色行为'],
      },
      tokenEstimate: 100,
    }

    const result = buildGovernanceContext(intent, composed)
    expect(result).toContain('本章意图')
    expect(result).toContain('测试')
    expect(result).toContain('规则栈')
    expect(result).toContain('硬护栏')
    expect(result).toContain('软约束')
  })

  it('mustAvoid 出现在软约束中', () => {
    const intent: ChapterIntent = {
      goal: '测试',
      mustKeep: [],
      mustAvoid: ['避免平淡结尾', '避免信息播报'],
      endState: '高潮',
    }

    const composed: ContextPackage = {
      selectedContext: '',
      ruleStack: {
        hard: ['保持角色一致性'],
        soft: ['避免：避免平淡结尾', '避免：避免信息播报'],
        diagnostic: [],
      },
      tokenEstimate: 50,
    }

    const result = buildGovernanceContext(intent, composed)
    expect(result).toContain('必须避免')
    expect(result).toContain('避免平淡结尾')
  })

  it('空上下文不崩溃', () => {
    const intent: ChapterIntent = {
      goal: '测试',
      mustKeep: [],
      mustAvoid: [],
      endState: '结束',
    }

    const composed: ContextPackage = {
      selectedContext: '',
      ruleStack: { hard: [], soft: [], diagnostic: [] },
      tokenEstimate: 0,
    }

    const result = buildGovernanceContext(intent, composed)
    expect(result).toContain('本章意图')
    expect(result).toContain('规则栈')
  })

  it('characterFocus 出现在输出中', () => {
    const intent: ChapterIntent = {
      goal: '测试',
      mustKeep: [],
      mustAvoid: [],
      endState: '结束',
      characterFocus: '李四',
    }

    const composed: ContextPackage = {
      selectedContext: '',
      ruleStack: { hard: [], soft: [], diagnostic: [] },
      tokenEstimate: 0,
    }

    const result = buildGovernanceContext(intent, composed)
    expect(result).toContain('李四')
  })
})
