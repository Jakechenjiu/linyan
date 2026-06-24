import { describe, it, expect } from 'vitest'
import { analyzeRhythm } from '../rhythm-detector'

describe('analyzeRhythm', () => {
  it('章节少于 2 章时返回空结果', () => {
    const result = analyzeRhythm([{ order: 1, title: '第一章', body: '他走在路上。' }])
    expect(result.wavePattern).toHaveLength(0)
    expect(result.issues).toHaveLength(0)
    expect(result.summary).toContain('太少')
  })

  it('检测连续 3 章相同类型', () => {
    const chapters = [
      { order: 1, title: '第一章', body: '他休息了一整天，睡觉吃饭散步聊天。平静的一天。' },
      { order: 2, title: '第二章', body: '他又休息了一整天，睡觉吃饭散步聊天。安静的一天。' },
      { order: 3, title: '第三章', body: '他继续休息，睡觉吃饭散步聊天。祥和的一天。' },
    ]
    const result = analyzeRhythm(chapters)
    const sameTypeIssue = result.issues.find(i => i.description.includes('连续 3 章'))
    expect(sameTypeIssue).toBeDefined()
  })

  it('检测高潮后缺少后效', () => {
    const chapters = [
      { order: 1, title: '第一章', body: '最终决战，他击败了敌人，取得了胜利，突破了境界。' },
      { order: 2, title: '第二章', body: '新的一天开始了，他准备踏上新的旅程。' },
    ]
    const result = analyzeRhythm(chapters)
    const missingAftermath = result.issues.find(i => i.description.includes('缺少后效'))
    expect(missingAftermath).toBeDefined()
  })

  it('正常节奏无警告', () => {
    const chapters = [
      { order: 1, title: '第一章', body: '他来到了一个新地方，探索周围的环境。' },
      { order: 2, title: '第二章', body: '战斗开始了，他与敌人激烈厮杀，鲜血飞溅。' },
      { order: 3, title: '第三章', body: '战斗结束后，他疗伤恢复，反思这次经历。' },
    ]
    const result = analyzeRhythm(chapters)
    expect(result.wavePattern).toHaveLength(3)
    // 应该有 setup, escalation/climax, aftermath
    const types = result.wavePattern.map(w => w.type)
    expect(types).toContain('setup')
  })

  it('返回正确的 wavePattern 结构', () => {
    const chapters = [
      { order: 1, title: '第一章', body: '探索新世界。' },
      { order: 2, title: '第二章', body: '遭遇强敌。' },
    ]
    const result = analyzeRhythm(chapters)
    for (const wave of result.wavePattern) {
      expect(wave).toHaveProperty('chapter')
      expect(wave).toHaveProperty('type')
      expect(wave).toHaveProperty('intensity')
      expect(['setup', 'escalation', 'climax', 'aftermath']).toContain(wave.type)
      expect(wave.intensity).toBeGreaterThanOrEqual(1)
      expect(wave.intensity).toBeLessThanOrEqual(10)
    }
  })

  it('英文模式也能工作', () => {
    const chapters = [
      { order: 1, title: 'Ch1', body: 'He walked peacefully through the quiet village.' },
      { order: 2, title: 'Ch2', body: 'A battle erupted, swords clashed, blood was spilled.' },
    ]
    const result = analyzeRhythm(chapters, 'en')
    expect(result.wavePattern).toHaveLength(2)
    expect(result.summary).toContain('setup')
  })
})
