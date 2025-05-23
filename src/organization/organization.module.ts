import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { Property } from '../property/entities/property.entity';
import { OrganizationService } from './organization.service';
import { OrganizationResolver } from './organization.resolver';
import { forwardRef } from '@nestjs/common';
import { PropertyModule } from 'property/property.module';
import { UserModule } from 'user/user.module';
import { DataLoaderModule } from 'data-loader/data-loader.module';
import { OrganizationMemberResolver } from './organization-member.resolver';
import { CacheModule } from '../cache/cache.module';
import { CommonModule } from '../common/common.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      OrganizationMember,
      Property
    ]),
    forwardRef(() => PropertyModule),
    forwardRef(() => UserModule),
    forwardRef(() => DataLoaderModule),
    forwardRef(() => CacheModule),
    CommonModule
  ],
  providers: [
    OrganizationService, 
    OrganizationResolver,
    OrganizationMemberResolver
  ],
  exports: [OrganizationService],
})
export class OrganizationModule {}
