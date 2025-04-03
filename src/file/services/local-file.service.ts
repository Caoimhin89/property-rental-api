import { Injectable } from '@nestjs/common';
import { FileStorageService, FileStorageOptions, UploadResponse } from '../interfaces/file-storage.interface';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalFileService implements FileStorageService {
  private readonly uploadDir = join(process.cwd(), 'files');
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  constructor() {
    // Create the upload directory if it doesn't exist
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  async uploadFile(file: Express.Multer.File, options?: FileStorageOptions): Promise<UploadResponse> {
    const folder = options?.folder || 'default';
    const folderPath = join(this.uploadDir, folder);
    
    // Ensure the folder exists
    await fs.mkdir(folderPath, { recursive: true });

    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = join(folder, filename);
    const fullPath = join(this.uploadDir, filePath);

    // Save the file
    await fs.writeFile(fullPath, file.buffer);

    return {
      key: filePath,
      url: `${this.baseUrl}/files/${filePath}`,
    };
  }

  async getFileUrl(key: string): Promise<string> {
    return `${this.baseUrl}/files/${key}`;
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await fs.unlink(join(this.uploadDir, key));
      return true;
    } catch {
      return false;
    }
  }
} 