import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { BookingModule } from '../booking/booking.module';
import { forwardRef } from '@nestjs/common';
import { DataLoaderModule } from '../data-loader/data-loader.module';
import { OrganizationModule } from '../organization/organization.module';
import { PropertyModule } from '../property/property.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    BookingModule,
    forwardRef(() => DataLoaderModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => PropertyModule)
  ],
  providers: [UserService, UserResolver],
  exports: [UserService]
})
export class UserModule {} 