import { Injectable } from '@nestjs/common';
import { FileStorageService, FileStorageOptions, UploadResponse } from '../interfaces/file-storage.interface';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class LocalFileService implements FileStorageService {
  constructor(private readonly configService: ConfigService) {}

  async uploadFile(file: Express.Multer.File, options?: FileStorageOptions): Promise<UploadResponse> {
    const uploadDir = this.configService.get('UPLOAD_DIR', 'uploads');
    const folder = options?.folder || 'default';
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, folder, fileName);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Save file
    await fs.writeFile(filePath, file.buffer);
    
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    
    return {
      key: path.join(folder, fileName),
      url: `${baseUrl}/files/${folder}/${fileName}`
    };
  }

  async getFileUrl(key: string): Promise<string> {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    return `${baseUrl}/files/${key}`;
  }

  async deleteFile(key: string): Promise<boolean> {
    const uploadDir = this.configService.get('UPLOAD_DIR', 'uploads');
    const filePath = path.join(uploadDir, key);
    
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
} 