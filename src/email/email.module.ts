import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { LoggerService } from '../common/services/logger.service';

@Module({
  imports: [KafkaModule],
  providers: [EmailService, LoggerService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {} 