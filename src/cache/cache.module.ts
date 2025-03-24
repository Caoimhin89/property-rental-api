import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheService } from './cache.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {} 