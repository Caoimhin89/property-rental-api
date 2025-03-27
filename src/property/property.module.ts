import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { Organization } from '../organization/entities/organization.entity';
import { PropertyService } from './property.service';
import { PropertyResolver } from './property.resolver';
import { DataLoaderModule } from '../data-loader/data-loader.module';
import { BookingModule } from '../booking/booking.module';
import { BlockedDate } from './entities/blocked-date.entity';
import { PriceRule } from './entities/price-rule.entity';
import { CommonModule } from '../common/common.module';
import { LocationModule } from '../location/location.module';
import { OrganizationModule } from '../organization/organization.module';
import { AmenityModule } from '../amenity/amenity.module';
import { CacheModule } from '../cache/cache.module';
import { Bed } from './entities/bed.entity';
import { NearbyPlaceModule } from '../nearby-place/nearby-place.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      BlockedDate,
      PriceRule,
      Bed,
      Organization
    ]),
    forwardRef(() => OrganizationModule),
    forwardRef(() => DataLoaderModule),
    forwardRef(() => BookingModule),
    forwardRef(() => AmenityModule),
    forwardRef(() => CacheModule),
    CommonModule,
    LocationModule,
    NearbyPlaceModule
  ],
  providers: [PropertyService, PropertyResolver],
  exports: [PropertyService],
})
export class PropertyModule {} 