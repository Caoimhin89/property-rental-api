import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PresignedUrl, PresignedUrlInput, UploadResponse, FileUploadInput } from '../graphql';
import { FileStorageFactoryService } from './services/file-storage-factory.service';
import { Readable } from 'stream';
import { ClientKafka } from '@nestjs/microservices';

console.log('FileResolver module is being loaded');

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
    private readonly fileStorageFactory: FileStorageFactoryService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
  ) {
    console.log('FileResolver constructor called');
  }

  @Mutation(() => PresignedUrl)
  async getPresignedUploadUrl(
    @Args('input') input: PresignedUrlInput
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
    @Args('propertyId') propertyId: string,
    @Args('input', { type: () => 'FileUploadInput' }) input: {
      file: Promise<FileUpload>;
      folder?: string;
      caption?: string;
    },
  ): Promise<UploadResponse> {
    try {
      console.log('1. Received request with propertyId:', propertyId);
      console.log('2. Input object:', JSON.stringify(input, null, 2));
      console.log('3. Input.file:', input?.file);

      if (!input || !input.file) {
        console.error('4. No input or file provided');
        throw new Error('No file provided');
      }

      console.log('5. About to await input.file');
      const fileUpload = await input.file;
      console.log('6. FileUpload object:', fileUpload);

      if (!fileUpload || !fileUpload.createReadStream) {
        console.error('7. Invalid file upload object:', fileUpload);
        throw new Error('Invalid file upload');
      }

      const { createReadStream, filename, mimetype } = fileUpload;
      console.log('8. File details:', { filename, mimetype });

      const fileService = this.fileStorageFactory.getFileService();
      console.log('9. Got file service');

      // Convert the upload to a Multer-like file object
      console.log('10. Starting buffer creation');
      const buffer: Buffer = await new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const stream = createReadStream();
        
        stream.on('data', (chunk) => {
          console.log('11. Received chunk of size:', chunk.length);
          chunks.push(Buffer.from(chunk));
        });
        
        stream.on('error', (error) => {
          console.error('12. Stream error:', error);
          reject(error);
        });
        
        stream.on('end', () => {
          console.log('13. Stream ended');
          resolve(Buffer.concat(chunks));
        });
      });
      console.log('14. Buffer created with size:', buffer.length);

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
      console.log('15. Created multerFile object');

      console.log('16. About to upload file with options:', { 
        folder: input.folder || 'uploads' 
      });
      
      const result = await fileService.uploadFile(multerFile, { 
        folder: input.folder || 'uploads' 
      });
      console.log('17. Upload result:', result);
      
      // Emit image upload event
      console.log('18. Emitting Kafka event');
      this.kafkaClient.emit('image.upload', {
        key: result.key,
        value: {
          propertyId,
          ...(input.caption && { caption: input.caption }),
          key: result.key,
          url: result.url,
        },
      });
      console.log('19. Kafka event emitted');

      return {
        key: result.key,
        url: result.url,
      };
    } catch (error) {
      console.error('ERROR in uploadFile:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
} 