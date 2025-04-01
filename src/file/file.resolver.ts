import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PresignedUrl, FileUploadInput } from '../graphql';

@Resolver('File')
@UseGuards(JwtAuthGuard)
export class FileResolver {
  constructor(private readonly fileService: FileService) {}

  @Mutation(() => PresignedUrl)
  async getPresignedUploadUrl(
    @Args('input') input: FileUploadInput
  ): Promise<PresignedUrl> {
    return this.fileService.createPresignedUploadUrl(input);
  }

  @Query(() => String)
  async getPresignedDownloadUrl(
    @Args('key') key: string
  ): Promise<string> {
    return this.fileService.createPresignedDownloadUrl(key);
  }

  @Mutation(() => Boolean)
  async deleteFile(
    @Args('key') key: string
  ): Promise<boolean> {
    return this.fileService.deleteFile(key);
  }
} 