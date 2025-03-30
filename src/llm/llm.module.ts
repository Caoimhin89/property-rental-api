import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { CommonModule } from '../common/common.module';
import { LlmResolver } from './llm.resolver';

@Module({
  imports: [CommonModule],
  providers: [LlmService, LlmResolver],
  exports: [LlmService],
})
export class LlmModule {} 