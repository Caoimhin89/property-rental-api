import { Global, Module } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'PUB_SUB',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const options = {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
          keyPrefix: 'pubsub:', // Add a prefix to avoid conflicts with cache
          retryStrategy: (times: number) => {
            console.log('Redis PubSub connection retry attempt:', times);
            return Math.min(times * 50, 2000);
          }
        };

        const publisher = new Redis(options);
        const subscriber = new Redis(options);

        publisher.on('connect', () => {
          console.log('Redis PubSub Publisher connected');
        });

        publisher.on('error', (err) => {
          console.error('Redis PubSub Publisher error:', err);
        });

        subscriber.on('connect', () => {
          console.log('Redis PubSub Subscriber connected');
        });

        subscriber.on('error', (err) => {
          console.error('Redis PubSub Subscriber error:', err);
        });

        const pubSub = new RedisPubSub({
          publisher,
          subscriber,
          connection: options
        });

        // Test the connection
        setTimeout(async () => {
          try {
            await pubSub.publish('test', { test: true });
            console.log('Redis PubSub test successful');
          } catch (error) {
            console.error('Redis PubSub test failed:', error);
          }
        }, 1000);

        return pubSub;
      }
    }
  ],
  exports: ['PUB_SUB']
})
export class PubSubModule {} 