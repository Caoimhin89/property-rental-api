import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { PresignedUrl, PresignedUrlInput } from '../../graphql';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class S3DirectService {
  private readonly s3Client: S3Client;
  private readonly logger = new LoggerService(S3DirectService.name);

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async createPresignedUploadUrl(input: PresignedUrlInput): Promise<PresignedUrl> {
    try {
      const fileExtension = input.fileName.split('.').pop();
      const key = `${input.folder || 'uploads'}/${uuidv4()}.${fileExtension}`;
      const expiresIn = 3600; // URL expires in 1 hour

      const command = new PutObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
        Key: key,
        ContentType: input.contentType,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn,
        signableHeaders: new Set(['content-type']),
      });

      return {
        url,
        key,
        expiresIn,
      };
    } catch (error) {
      this.logger.error('Error generating presigned URL', error);
      throw error;
    }
  }

  async createPresignedDownloadUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });
    } catch (error) {
      this.logger.error('Error generating download URL', error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      this.logger.error('Error deleting file', error);
      throw error;
    }
  }
} 