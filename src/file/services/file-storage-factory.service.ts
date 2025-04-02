import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileStorageService } from '../interfaces/file-storage.interface';
import { LocalFileService } from './local-file.service';
import { S3StorageService } from './s3-storage.service';
import { S3DirectService } from './s3-direct.service';

@Injectable()
export class FileStorageFactoryService {
  constructor(
    private readonly configService: ConfigService,
    private readonly localFileService: LocalFileService,
    private readonly s3StorageService: S3StorageService,
    private readonly s3DirectService: S3DirectService,
  ) {}

  getFileService(): FileStorageService {
    const useS3 = this.configService.get('USE_S3_STORAGE', 'false') === 'true';
    return useS3 ? this.s3StorageService : this.localFileService;
  }

  getDirectUploadService() {
    return this.s3DirectService;
  }
}