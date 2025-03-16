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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      BlockedDate,
      PriceRule,
      Organization
    ]),
    forwardRef(() => OrganizationModule),
    forwardRef(() => DataLoaderModule),
    forwardRef(() => BookingModule),
    forwardRef(() => AmenityModule),
    CommonModule,
    LocationModule
  ],
  providers: [PropertyService, PropertyResolver],
  exports: [PropertyService],
})
export class PropertyModule {} 