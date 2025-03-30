import { Module, forwardRef } from '@nestjs/common';
import { BookingResolver } from './booking.resolver';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyModule } from '../property/property.module';
import { DataLoaderModule } from '../data-loader/data-loader.module';
import { KafkaModule } from '../kafka/kafka.module';
import { CommonModule } from '../common/common.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    forwardRef(() => PropertyModule),
    forwardRef(() => DataLoaderModule),
    KafkaModule,
    CommonModule
  ],
  providers: [BookingResolver, BookingService],
  exports: [BookingService],
})
export class BookingModule {} 