import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export const RedisPubSubProvider = {
  provide: 'PUB_SUB',
  useFactory: (configService: ConfigService) => {
    const options = {
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      retryStrategy: (times: number) => {
        // retry strategy
        return Math.min(times * 50, 2000);
      }
    };

    return new RedisPubSub({
      publisher: new Redis(options),
      subscriber: new Redis(options)
    });
  },
  inject: [ConfigService]
};