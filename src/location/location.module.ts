import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationService } from './location.service';
import { LocationResolver } from './location.resolver';
import { NearbyPlaceService } from '../nearby-place/nearby-place.service';
import { NearbyPlace } from '../nearby-place/entities/nearby-place.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Location,
      NearbyPlace
    ]),
  ],
  providers: [
    LocationService, 
    LocationResolver,
    NearbyPlaceService
  ],
  exports: [
    LocationService, 
    LocationResolver
  ]
})
export class LocationModule {} 