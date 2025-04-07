import { Global, Module } from '@nestjs/common';
import { RedisPubSubProvider } from './redis-pub-sub.provider';

@Global()
@Module({
  providers: [RedisPubSubProvider],
  exports: [RedisPubSubProvider]
})
export class RedisPubSubModule {}