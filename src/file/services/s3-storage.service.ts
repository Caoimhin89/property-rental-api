import { Injectable } from '@nestjs/common';
import { FileStorageService, FileStorageOptions, UploadResponse } from '../interfaces/file-storage.interface';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class S3StorageService implements FileStorageService {
  private readonly s3Client: S3Client;
  private readonly logger = new LoggerService(S3StorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(file: Express.Multer.File, options?: FileStorageOptions): Promise<UploadResponse> {
    const folder = options?.folder || 'default';
    const key = `${folder}/${uuidv4()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
      Key: key,
      Body: file.buffer,
      ContentType: options?.contentType || file.mimetype,
    });

    await this.s3Client.send(command);
    const url = await this.getFileUrl(key);

    return { key, url };
  }

  async getFileUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
        Key: key,
      });
      
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }
} 