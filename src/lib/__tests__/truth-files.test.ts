import { describe, it, expect, vi } from 'vitest'

// Mock prisma — truth-files.ts 导入了 db.ts，需要阻止 PrismaClient 初始化
vi.mock('@/lib/db', () => ({
  prisma: {
    truthFile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

import { buildTruthFileContext, TRUTH_FILE_TYPES, TRUTH_FILE_LABELS } from '../truth-files'
import type { TruthFileType } from '../truth-files'

const mockTruthFiles: Record<TruthFileType, string> = {
  current_state: '# 世界状态\n- 修仙世界\n- 主角：张三',
  particle_ledger: '',
  pending_hooks: '- 伏笔1：神秘老人\n- 伏笔2：破碎的玉佩',
  chapter_summaries: [
    '# 章节摘要',
    '| 章节 | 标题 | 出场人物 | 关键事件 | 状态变化 | 伏笔动态 | 情绪基调 |',
    '|------|------|----------|----------|----------|----------|----------|',
    '| 1 | 第一章 | 张三 | 遇见师父 | 踏入修途 | 老人出现 | 平静 |',
    '| 2 | 第二章 | 张三、李四 | 拜入山门 | 成为弟子 | 玉佩碎裂 | 紧张 |',
  ].join('\n'),
  subplot_board: '',
  emotional_arcs: '',
  character_matrix: '| 角色 | 角色 | 相遇次数 | 最近相遇 | 关系状态 |\n|------|------|----------|----------|----------|\n| 张三 | 李四 | 1 | 第2章 | 同门 |',
}

describe('buildTruthFileContext', () => {
  it('包含非空真相文件', () => {
    const result = buildTruthFileContext(mockTruthFiles)
    expect(result).toContain('世界状态')
    expect(result).toContain('伏笔池')
    expect(result).toContain('章节摘要')
  })

  it('空内容不输出', () => {
    const result = buildTruthFileContext(mockTruthFiles)
    expect(result).not.toContain('资源账本')
    expect(result).not.toContain('支线进度板')
    expect(result).not.toContain('情感弧线')
  })

  it('按 includeTypes 过滤', () => {
    const result = buildTruthFileContext(mockTruthFiles, {
      includeTypes: ['current_state'],
    })
    expect(result).toContain('世界状态')
    expect(result).not.toContain('伏笔')
    expect(result).not.toContain('章节摘要')
  })

  it('按 maxLength 截断', () => {
    // maxLength=100 允许第一个 section，第二个 section 会被截断
    const result = buildTruthFileContext(mockTruthFiles, { maxLength: 100 })
    expect(result).toContain('已截断')
  })

  it('maxLength 足够大时不截断', () => {
    const result = buildTruthFileContext(mockTruthFiles, { maxLength: 10000 })
    expect(result).not.toContain('已截断')
  })

  it('滑动窗口：15章以内不压缩', () => {
    // 构造 10 章的摘要
    const lines = ['# 章节摘要', '| 章节 | 标题 | 出场人物 | 关键事件 | 状态变化 | 伏笔动态 | 情绪基调 |', '|------|------|----------|----------|----------|----------|----------|']
    for (let i = 1; i <= 10; i++) {
      lines.push(`| ${i} | 第${i}章 | 张三 | 事件${i} | 变化${i} | - | - |`)
    }
    const files = { ...mockTruthFiles, chapter_summaries: lines.join('\n') }
    const result = buildTruthFileContext(files, { currentChapter: 10 })
    expect(result).toContain('第10章')
    expect(result).not.toContain('压缩摘要')
  })

  it('滑动窗口：超过15章时压缩早期', () => {
    // 构造 20 章的摘要
    const lines = ['# 章节摘要', '| 章节 | 标题 | 出场人物 | 关键事件 | 状态变化 | 伏笔动态 | 情绪基调 |', '|------|------|----------|----------|----------|----------|----------|']
    for (let i = 1; i <= 20; i++) {
      lines.push(`| ${i} | 第${i}章 | 张三 | 事件${i} | 变化${i} | 伏笔${i} | - |`)
    }
    const files = { ...mockTruthFiles, chapter_summaries: lines.join('\n') }
    const result = buildTruthFileContext(files, { currentChapter: 20 })
    expect(result).toContain('压缩摘要')
    expect(result).toContain('第20章') // 最近的章节保留
  })
})

describe('TRUTH_FILE_TYPES', () => {
  it('有 7 种类型', () => {
    expect(TRUTH_FILE_TYPES).toHaveLength(7)
  })

  it('每种类型都有中文标签', () => {
    for (const type of TRUTH_FILE_TYPES) {
      expect(TRUTH_FILE_LABELS[type]).toBeTruthy()
    }
  })
})
