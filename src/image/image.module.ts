import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageService } from './image.service';
import { ImageResolver } from './image.resolver';
import { Image } from './entities/image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Image])],
  providers: [ImageService, ImageResolver],
  exports: [ImageService],
})
export class ImageModule {} 