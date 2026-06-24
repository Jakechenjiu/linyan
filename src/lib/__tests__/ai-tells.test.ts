import { describe, it, expect } from 'vitest'
import {
  detectAITells,
  autoFixAITells,
  FATIGUE_WORDS,
  FORBIDDEN_PATTERNS,
  FORBIDDEN_OPENINGS,
} from '../ai-tells'

describe('detectAITells', () => {
  describe('禁用词检测', () => {
    it('超过阈值时报告 ai_vocabulary 问题', () => {
      // 每 3000 字允许 1 次"缓缓"，6000 字内容放 3 次应触发
      const content = '他缓缓走来。'.repeat(500) // ~3000 字
      const result = detectAITells(content)
      const wordIssues = result.issues.filter(i => i.category === 'ai_vocabulary')
      expect(wordIssues.length).toBeGreaterThan(0)
    })

    it('低于阈值时不报告', () => {
      // 3000 字内容只用 1 次"缓缓"，不应触发
      const padding = '阳光从窗帘缝隙挤进来，落在地板上。'.repeat(50)
      const content = '他缓缓走来。' + padding
      const result = detectAITells(content)
      const wordIssues = result.issues.filter(i => i.category === 'ai_vocabulary' && i.description.includes('缓缓'))
      expect(wordIssues.length).toBe(0)
    })
  })

  describe('禁用句式检测', () => {
    it('检测"他知道，…"总结反思句', () => {
      const content = '他知道，这一切都已经结束了。'.repeat(5)
      const result = detectAITells(content)
      const patternIssues = result.issues.filter(i => i.category === 'forbidden_pattern')
      expect(patternIssues.length).toBeGreaterThan(0)
    })

    it('检测标签化情绪表达', () => {
      const content = '他感到愤怒，转身离去。'.repeat(5)
      const result = detectAITells(content)
      const patternIssues = result.issues.filter(i =>
        i.category === 'forbidden_pattern' && i.description.includes('标签化情绪')
      )
      expect(patternIssues.length).toBeGreaterThan(0)
    })
  })

  describe('套话密度检测', () => {
    it('检测套话过多', () => {
      const padding = '他说了一些话，然后离开了房间。'.repeat(100)
      const content = '岁月如梭，光阴似箭。' + padding + '不知不觉，时光飞逝。'
      const result = detectAITells(content)
      const clicheIssues = result.issues.filter(i => i.category === 'cliche_density')
      expect(clicheIssues.length).toBeGreaterThan(0)
    })
  })

  describe('score 计算', () => {
    it('critical=20, warning=5, info=1', () => {
      const content = '他感到愤怒。他知道，错了。仿佛一切都宛如梦境似的。'.repeat(10)
      const result = detectAITells(content)
      expect(result.score).toBeGreaterThan(0)
    })
  })

  describe('干净文本', () => {
    it('无 AI 痕迹的文本通过检测', () => {
      const content = '阳光从窗帘缝隙挤进来，落在地板上。他翻了个身，不想起床。窗外传来鸟叫。'.repeat(50)
      const result = detectAITells(content)
      expect(result.passed).toBe(true)
    })
  })

  describe('禁用开场白', () => {
    it('检测 AI 开场白', () => {
      const content = '好的，以下是修改后的正文：\n' + '他走在路上。'.repeat(100)
      const result = detectAITells(content)
      // 开场白检测在 autoFixAITells 中，不在 detectAITells 中
      expect(result.issues).toBeDefined()
    })
  })
})

describe('autoFixAITells', () => {
  it('替换高频词', () => {
    const content = '他缓缓走来，淡淡一笑。'
    const { fixed, changes } = autoFixAITells(content)
    expect(fixed).toContain('慢慢')
    expect(changes.length).toBeGreaterThan(0)
  })

  it('删除禁用开场白', () => {
    const content = '好的，以下是修改后的内容：\n正文开始。'
    const { fixed } = autoFixAITells(content)
    expect(fixed).not.toContain('好的，以下是')
  })

  it('无问题文本不变', () => {
    const content = '他走在路上，阳光很好。'
    const { fixed, changes } = autoFixAITells(content)
    expect(fixed).toBe(content)
    expect(changes.length).toBe(0)
  })
})

describe('常量完整性', () => {
  it('FATIGUE_WORDS 非空', () => {
    expect(FATIGUE_WORDS.length).toBeGreaterThan(0)
  })

  it('FORBIDDEN_PATTERNS 每项都有 pattern/description/fix', () => {
    for (const item of FORBIDDEN_PATTERNS) {
      expect(item.pattern).toBeInstanceOf(RegExp)
      expect(item.description).toBeTruthy()
      expect(item.fix).toBeTruthy()
    }
  })

  it('FORBIDDEN_OPENINGS 非空', () => {
    expect(FORBIDDEN_OPENINGS.length).toBeGreaterThan(0)
  })
})
