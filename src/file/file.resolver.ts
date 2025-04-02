import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PresignedUrl, FileUploadInput, UploadResponse } from '../graphql';
import { FileStorageFactoryService } from './services/file-storage-factory.service';
import { Readable } from 'stream';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js';

interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => Readable;
}

@Resolver('File')
@UseGuards(JwtAuthGuard)
export class FileResolver {
  constructor(
    private readonly fileStorageFactory: FileStorageFactoryService
  ) {}

  @Mutation(() => PresignedUrl)
  async getPresignedUploadUrl(
    @Args('input') input: FileUploadInput
  ): Promise<PresignedUrl> {
    const directService = this.fileStorageFactory.getDirectUploadService();
    return directService.createPresignedUploadUrl(input);
  }

  @Query(() => String)
  async getPresignedDownloadUrl(
    @Args('key') key: string
  ): Promise<string> {
    const directService = this.fileStorageFactory.getDirectUploadService();
    return directService.createPresignedDownloadUrl(key);
  }

  @Mutation(() => Boolean)
  async deleteFile(
    @Args('key') key: string
  ): Promise<boolean> {
    const fileService = this.fileStorageFactory.getFileService();
    return fileService.deleteFile(key);
  }

  @Mutation(() => UploadResponse)
  async uploadFile(
    @Args({
      name: 'file',
      type: () => GraphQLUpload
    })
    upload: Promise<FileUpload>,
    @Args('folder', { nullable: true }) folder?: string,
  ): Promise<UploadResponse> {
    const file = await upload;
    const { createReadStream, filename, mimetype } = file;
    
    const fileService = this.fileStorageFactory.getFileService();

    // Convert the upload to a Multer-like file object
    const buffer: Buffer = await new Promise(async (resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream();
      
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (error) => reject(error));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const multerFile: Express.Multer.File = {
      buffer,
      originalname: filename,
      mimetype,
      size: buffer.length,
      fieldname: 'file',
      encoding: '7bit',
      destination: '',
      filename: '',
      path: '',
      stream: createReadStream() as unknown as Express.Multer.File['stream'],
    };

    return fileService.uploadFile(multerFile, { folder });
  }
} 