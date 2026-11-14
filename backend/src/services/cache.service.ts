import { EventEmitter } from "events"

import { ICacheService } from "../types/index.ts"

interface CacheEntry {
  value: any
  expiresAt: number | null
}

/**
 * In-memory cache service used for local key-value storage and lightweight pub/sub.
 */
export class InMemoryCacheService implements ICacheService {
  private cache = new Map<string, CacheEntry>()
  private emitter = new EventEmitter()

  /**
   * Retrieves a cached value from in-memory storage when it exists and is not expired.
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.value as T
  }

  /**
   * Stores a value in in-memory cache with an optional TTL.
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    this.cache.set(key, { value, expiresAt })
  }

  /**
   * Removes a single cached entry from in-memory storage.
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  /**
   * Clears all entries from in-memory cache storage.
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }

  /**
   * Registers an in-memory subscriber for a cache channel.
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    this.emitter.on(channel, callback)
  }

  /**
   * Publishes a message to in-memory subscribers for a cache channel.
   */
  async publish(channel: string, message: string): Promise<void> {
    this.emitter.emit(channel, message)
  }
}

// Global cache service factory helper
/**
 * Creates the active cache service implementation.
 */
export function createCacheService(): ICacheService {
  return new InMemoryCacheService()
}

export const cacheService = createCacheService()
