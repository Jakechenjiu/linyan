// LRU 缓存 — 替代无限膨胀的 Map，带 TTL 和最大条目数

interface CacheEntry<T> {
  value: T
  ts: number
}

export class LRUCache<K, V> {
  private map = new Map<K, CacheEntry<V>>()
  private maxSize: number
  private ttl: number

  constructor(maxSize: number = 500, ttlMs: number = 5 * 60_000) {
    this.maxSize = maxSize
    this.ttl = ttlMs
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined
    if (Date.now() - entry.ts > this.ttl) {
      this.map.delete(key)
      return undefined
    }
    // 刷新位置（LRU：删除再插入使其成为最新）
    this.map.delete(key)
    this.map.set(key, entry)
    return entry.value
  }

  set(key: K, value: V): void {
    // 如果已存在，先删除（后面重新插入到末尾）
    if (this.map.has(key)) {
      this.map.delete(key)
    }
    // 超过上限，删除最老的条目（Map 迭代顺序 = 插入顺序）
    if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value
      if (firstKey !== undefined) this.map.delete(firstKey)
    }
    this.map.set(key, { value, ts: Date.now() })
  }

  delete(key: K): void {
    this.map.delete(key)
  }

  has(key: K): boolean {
    const entry = this.map.get(key)
    if (!entry) return false
    if (Date.now() - entry.ts > this.ttl) {
      this.map.delete(key)
      return false
    }
    return true
  }

  clear(): void {
    this.map.clear()
  }

  /** 清理过期条目 */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0
    for (const [key, entry] of this.map) {
      if (now - entry.ts > this.ttl) {
        this.map.delete(key)
        cleaned++
      }
    }
    return cleaned
  }

  get size(): number {
    return this.map.size
  }
}
