import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewResolver } from './review.resolver';
import { Review } from './entities/review.entity';
import { DataLoaderModule } from '../data-loader/data-loader.module';
import { PropertyModule } from '../property/property.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
    forwardRef(() => DataLoaderModule),
    forwardRef(() => PropertyModule),
    forwardRef(() => UserModule),
  ],
  providers: [ReviewService, ReviewResolver],
  exports: [ReviewService],
})
export class ReviewModule {} 