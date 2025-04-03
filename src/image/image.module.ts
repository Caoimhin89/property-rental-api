import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageService } from './image.service';
import { ImageResolver } from './image.resolver';
import { Image } from './entities/image.entity';
import { ImageController } from './image.controller';
import { CommonModule } from 'common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Image]),
    CommonModule,
  ],
  controllers: [ImageController],
  providers: [ImageService, ImageResolver],
  exports: [ImageService],
})
export class ImageModule {} 