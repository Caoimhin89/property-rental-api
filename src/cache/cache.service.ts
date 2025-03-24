import { Injectable } from '@nestjs/common';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

@Injectable()
export class CacheService {
  private redis: Keyv;

  constructor() {
    this.redis = new Keyv({
      store: new KeyvRedis(`redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`),
    });

    // Add error logging
    this.redis.on('error', (err) => console.error('Redis Cache Error:', err));
  }

  getNamespacedCache(namespace: string, ttl?: number): Keyv {
    return new Keyv({
      store: this.redis.store,
      namespace,
      ttl: ttl || 60000 // default 60 seconds
    });
  }
} 