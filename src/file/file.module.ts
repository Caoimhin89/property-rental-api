import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileResolver } from './file.resolver';
import { LocalFileService } from './services/local-file.service';
import { S3StorageService } from './services/s3-storage.service';
import { FileStorageFactoryService } from './services/file-storage-factory.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { S3DirectService } from './services/s3-direct.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
    }),
  ],
  providers: [
    FileResolver,
    LocalFileService,
    S3StorageService,
    S3DirectService,
    FileStorageFactoryService,
  ],
  exports: [FileStorageFactoryService],
})
export class FileModule {} 