import { Module } from '@nestjs/common';
import { EventProcessorService } from './event-processor.service';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { PropertyModule } from '../property/property.module';

@Module({
  imports: [MaintenanceModule, PropertyModule],
  providers: [EventProcessorService],
})
export class EventProcessorModule {}
