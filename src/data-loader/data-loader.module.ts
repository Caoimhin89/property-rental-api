import { Module, forwardRef } from '@nestjs/common';
import { DataLoaderService } from './data-loader.service';
import { AmenityModule } from '../amenity/amenity.module';
import { ImageModule } from '../image/image.module';
import { UserModule } from '../user/user.module';
import { PropertyModule } from '../property/property.module';
import { ReviewModule } from '../review/review.module';
import { LocationModule } from '../location/location.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { NearbyPlaceModule } from '../nearby-place/nearby-place.module';
import { BookingModule } from '../booking/booking.module';
@Module({
  imports: [
    forwardRef(() => AmenityModule),
    forwardRef(() => ImageModule),
    forwardRef(() => UserModule),
    forwardRef(() => PropertyModule),
    forwardRef(() => ReviewModule),
    forwardRef(() => LocationModule),
    forwardRef(() => MaintenanceModule),
    forwardRef(() => NearbyPlaceModule),
    forwardRef(() => BookingModule),
  ],
  providers: [DataLoaderService],
  exports: [DataLoaderService],
})
export class DataLoaderModule {} 