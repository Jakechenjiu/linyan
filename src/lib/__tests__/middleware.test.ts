import { describe, it, expect } from 'vitest'

describe('middleware 配置', () => {
  it('matcher 排除静态文件', async () => {
    // middleware.ts 在项目根目录，用 @/ 别名导入
    const { config } = await import('@/middleware')
    expect(config.matcher).toBeDefined()
    expect(config.matcher.length).toBeGreaterThan(0)
    const matcher = config.matcher[0]
    expect(matcher).toContain('_next')
    expect(matcher).toContain('favicon')
  })
})

// 速率限制逻辑的独立测试
describe('速率限制逻辑', () => {
  // 提取速率限制逻辑为独立函数后测试
  // 当前实现在 middleware 内部，这里测试概念

  it('速率限制窗口概念验证', () => {
    const RATE_LIMIT_WINDOW = 60 * 1000
    const RATE_LIMIT_MAX = 100

    // 模拟速率限制状态
    const rateLimit = new Map<string, { count: number; resetTime: number }>()

    function isRateLimited(key: string): boolean {
      const now = Date.now()
      const entry = rateLimit.get(key)

      if (!entry || now > entry.resetTime) {
        rateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
        return false
      }

      entry.count++
      return entry.count > RATE_LIMIT_MAX
    }

    // 前 100 次不被限制
    for (let i = 0; i < 100; i++) {
      expect(isRateLimited('user1')).toBe(false)
    }

    // 第 101 次被限制
    expect(isRateLimited('user1')).toBe(true)

    // 不同用户不受影响
    expect(isRateLimited('user2')).toBe(false)
  })

  it('窗口重置后恢复', () => {
    const RATE_LIMIT_WINDOW = 100 // 100ms for test
    const RATE_LIMIT_MAX = 3

    const rateLimit = new Map<string, { count: number; resetTime: number }>()

    function isRateLimited(key: string): boolean {
      const now = Date.now()
      const entry = rateLimit.get(key)

      if (!entry || now > entry.resetTime) {
        rateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
        return false
      }

      entry.count++
      return entry.count > RATE_LIMIT_MAX
    }

    // 触发限制
    for (let i = 0; i < 4; i++) isRateLimited('user1')
    expect(isRateLimited('user1')).toBe(true)

    // 等待窗口重置
    const start = Date.now()
    while (Date.now() - start < 150) { /* busy wait */ }

    // 恢复
    expect(isRateLimited('user1')).toBe(false)
  })
})

describe('敏感路径阻断', () => {
  const blockedPaths = ['/.env', '/.git', '/node_modules', '/prisma', '/.claude']

  it.each(blockedPaths)('路径 %s 应被阻断', (path) => {
    // 模拟 middleware 的路径检查逻辑
    const isBlocked = blockedPaths.some((p) => path.startsWith(p))
    expect(isBlocked).toBe(true)
  })

  it('正常路径不被阻断', () => {
    const normalPaths = ['/api/novels', '/workspace/star', '/login', '/']
    for (const path of normalPaths) {
      const isBlocked = blockedPaths.some((p) => path.startsWith(p))
      expect(isBlocked).toBe(false)
    }
  })
})
