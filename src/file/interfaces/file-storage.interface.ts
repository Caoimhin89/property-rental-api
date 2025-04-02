export interface FileStorageOptions {
  folder?: string;
  contentType?: string;
}

export interface UploadResponse {
  key: string;
  url: string;
}

export interface FileStorageService {
  uploadFile(file: Express.Multer.File, options?: FileStorageOptions): Promise<UploadResponse>;
  getFileUrl(key: string): Promise<string>;
  deleteFile(key: string): Promise<boolean>;
} 