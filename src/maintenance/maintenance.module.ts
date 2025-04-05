import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { MaintenanceComment } from './entities/maintenance-comment.entity';
import { MaintenanceImage } from './entities/maintenance-image.entity';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceResolver } from './maintenance.resolver';
import { PropertyModule } from '../property/property.module';
import { UserModule } from '../user/user.module';
import { forwardRef } from '@nestjs/common';
import { LoggerService } from '../common/services/logger.service';
import { CacheModule } from '../cache/cache.module';
import { CommonModule } from '../common/common.module';
import { MaintenanceCommentResolver } from './maintenance-comment.resolver';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaintenanceRequest,
      MaintenanceComment,
      MaintenanceImage
    ]),
    forwardRef(() => PropertyModule),
    forwardRef(() => UserModule),
    forwardRef(() => CommonModule),
    CacheModule
  ],
  providers: [
    MaintenanceService,
    MaintenanceResolver,
    LoggerService,
    MaintenanceCommentResolver,
  ],
  exports: [MaintenanceService]
})
export class MaintenanceModule {}
