import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { createHash } from 'crypto';
import { CacheSetEvent, CacheInvalidateEvent } from './cache.events';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Keyv;
  private caches: Map<string, Keyv> = new Map();

  constructor() {
    this.redis = new Keyv({
      store: new KeyvRedis(`redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`),
    });

    // Add error logging
    this.redis.on('error', (err) => this.logger.error('Redis Cache Error:', err));
  }

  getNamespacedCache(namespace: string, ttl?: number): Keyv {
    const cacheKey = `${namespace}:${ttl || 60000}`;
    if (!this.caches.has(cacheKey)) {
      this.caches.set(
        cacheKey,
        new Keyv({
          store: this.redis.store,
          namespace,
          ttl: ttl || 60000
        })
      );
    }
    return this.caches.get(cacheKey)!;
  }

  generateCacheKey(prefix: string, data?: any): string {
    if (!data) {
      return prefix;
    }
    
    const hash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    
    return `${prefix}:${hash}`;
  }

  // Synchronous cache get operations
  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      const cache = this.getNamespacedCache(namespace);
      const cached = await cache.get(key);
      this.logger.debug(`Cache get: ${namespace}::${key}`, !!cached);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error(`Cache get failed for key ${key}`, error);
      return null;
    }
  }

  @OnEvent('cache.set')
  private async handleCacheSet(event: CacheSetEvent) {
    try {
      const cache = this.getNamespacedCache(event.namespace, event.ttl);
      await cache.set(event.key, JSON.stringify(event.value));
      this.logger.debug(`Cache set: ${event.namespace}::${event.key}`);
    } catch (error) {
      this.logger.error('Cache set failed:', error);
    }
  }

  @OnEvent('cache.invalidate')
  private async handleCacheInvalidate(event: CacheInvalidateEvent) {
    try {
      const cache = this.getNamespacedCache(event.namespace);
      await cache.delete(event.pattern);
      this.logger.debug(`Cache invalidated: ${event.namespace}::${event.pattern}`);
    } catch (error) {
      this.logger.error('Cache invalidation failed:', error);
    }
  }
} 