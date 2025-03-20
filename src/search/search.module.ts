import { forwardRef, Module } from '@nestjs/common';
import { DataLoaderModule } from '../data-loader/data-loader.module';
import { CommonModule } from '../common/common.module';
import { SearchService } from './search.service';
import { SearchResolver } from './search.resolver';
import { Property } from 'property/entities/property.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property]),
    forwardRef(() => DataLoaderModule),
    CommonModule,
  ],
  providers: [SearchService, SearchResolver],
  exports: [SearchService],
})
export class SearchModule {} 