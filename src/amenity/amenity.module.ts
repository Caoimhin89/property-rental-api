import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from './entities/amenity.entity';
import { AmenityService } from './amenity.service';
import { AmenityResolver } from './amenity.resolver';
import { Property } from '../property/entities/property.entity';
import { PropertyModule } from '../property/property.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Amenity, Property]),
    forwardRef(() => PropertyModule)
  ],
  providers: [AmenityService, AmenityResolver],
  exports: [AmenityService],
})
export class AmenityModule {} 