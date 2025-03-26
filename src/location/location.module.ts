import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationService } from './location.service';
import { GeocodingService } from './services/geocoding.service';
import { LocationResolver } from './location.resolver';
import { NearbyPlaceService } from '../nearby-place/nearby-place.service';
import { NearbyPlace } from '../nearby-place/entities/nearby-place.entity';
import { CacheModule } from '../cache/cache.module';
import { CommonModule } from '../common/common.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Location,
      NearbyPlace
    ]),
    forwardRef(() => CacheModule),
    CommonModule,
    ConfigModule
  ],
  providers: [
    LocationService,
    LocationResolver,
    NearbyPlaceService,
    GeocodingService
  ],
  exports: [
    LocationService, 
    LocationResolver,
    GeocodingService
  ]
})
export class LocationModule {} 