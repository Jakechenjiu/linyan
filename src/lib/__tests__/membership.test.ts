import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FREE_LIMITS, generateMembershipId } from '../membership'

// membership.ts 的纯函数可以直接测试
// 异步函数（checkMembership, canAccessFeature 等）需要 mock prisma

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    novel: { count: vi.fn() },
    content: { count: vi.fn() },
    videoProject: { count: vi.fn() },
  },
}))

describe('FREE_LIMITS', () => {
  it('免费用户小说限制为 2', () => {
    expect(FREE_LIMITS.maxNovels).toBe(2)
  })

  it('免费用户每本小说章节数限制为 10', () => {
    expect(FREE_LIMITS.maxChaptersPerNovel).toBe(10)
  })

  it('免费用户无万象推演', () => {
    expect(FREE_LIMITS.hasWanxiang).toBe(false)
  })

  it('免费用户无灵思笔记', () => {
    expect(FREE_LIMITS.hasNotes).toBe(false)
  })

  it('免费用户无导出', () => {
    expect(FREE_LIMITS.hasExport).toBe(false)
  })

  it('免费用户无 AI 对话编辑', () => {
    expect(FREE_LIMITS.hasAiChat).toBe(false)
  })

  it('免费用户无批量生成', () => {
    expect(FREE_LIMITS.hasBatchGenerate).toBe(false)
  })
})

describe('generateMembershipId', () => {
  it('生成的 ID 以 PRO- 开头', () => {
    const id = generateMembershipId()
    expect(id).toMatch(/^PRO-/)
  })

  it('格式为 PRO-YYYYMMDD-NNN', () => {
    const id = generateMembershipId()
    expect(id).toMatch(/^PRO-\d{8}-\d{3}$/)
  })

  it('每次生成的 ID 不同（大概率）', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateMembershipId()))
    // 100 次生成至少有 50 个不同值（3 位随机数碰撞概率低）
    expect(ids.size).toBeGreaterThan(50)
  })
})
