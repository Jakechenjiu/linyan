import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LRUCache } from '../cache-lru'

describe('LRUCache', () => {
  it('基本 get/set', () => {
    const cache = new LRUCache<string, string>(10, 60_000)
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
    expect(cache.get('nonexistent')).toBeUndefined()
  })

  it('超过 maxSize 淘汰最老条目', () => {
    const cache = new LRUCache<string, string>(3, 60_000)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    cache.set('d', '4') // 应该淘汰 'a'
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('d')).toBe('4')
  })

  it('get 刷新 LRU 位置', () => {
    const cache = new LRUCache<string, string>(3, 60_000)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    cache.get('a') // 刷新 'a' 的位置
    cache.set('d', '4') // 应该淘汰 'b'（最老的未访问）
    expect(cache.get('a')).toBe('1')
    expect(cache.get('b')).toBeUndefined()
  })

  it('TTL 过期', () => {
    const cache = new LRUCache<string, string>(10, 100) // 100ms TTL
    cache.set('key', 'value')
    expect(cache.get('key')).toBe('value')

    // 等待过期
    vi.useFakeTimers()
    vi.advanceTimersByTime(150)
    expect(cache.get('key')).toBeUndefined()
    vi.useRealTimers()
  })

  it('has 检查过期', () => {
    const cache = new LRUCache<string, string>(10, 100)
    cache.set('key', 'value')
    expect(cache.has('key')).toBe(true)

    vi.useFakeTimers()
    vi.advanceTimersByTime(150)
    expect(cache.has('key')).toBe(false)
    vi.useRealTimers()
  })

  it('delete 删除条目', () => {
    const cache = new LRUCache<string, string>(10, 60_000)
    cache.set('key', 'value')
    cache.delete('key')
    expect(cache.get('key')).toBeUndefined()
  })

  it('clear 清空所有', () => {
    const cache = new LRUCache<string, string>(10, 60_000)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('cleanup 清理过期条目', () => {
    const cache = new LRUCache<string, string>(10, 100)
    cache.set('a', '1')
    cache.set('b', '2')

    vi.useFakeTimers()
    vi.advanceTimersByTime(150)
    const cleaned = cache.cleanup()
    expect(cleaned).toBe(2)
    expect(cache.size).toBe(0)
    vi.useRealTimers()
  })

  it('size 返回当前条目数', () => {
    const cache = new LRUCache<string, string>(10, 60_000)
    expect(cache.size).toBe(0)
    cache.set('a', '1')
    expect(cache.size).toBe(1)
    cache.set('b', '2')
    expect(cache.size).toBe(2)
  })

  it('覆盖已有 key 不增加 size', () => {
    const cache = new LRUCache<string, string>(10, 60_000)
    cache.set('key', 'old')
    cache.set('key', 'new')
    expect(cache.size).toBe(1)
    expect(cache.get('key')).toBe('new')
  })
})
