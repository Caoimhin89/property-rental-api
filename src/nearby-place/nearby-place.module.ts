import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NearbyPlace } from './entities/nearby-place.entity';
import { NearbyPlaceService } from './nearby-place.service';

@Module({
  imports: [TypeOrmModule.forFeature([NearbyPlace])],
  providers: [NearbyPlaceService],
  exports: [NearbyPlaceService],
})
export class NearbyPlaceModule {} 