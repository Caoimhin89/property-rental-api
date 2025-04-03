import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { LoggerService } from '../common/services/logger.service';
import { ImageService } from './image.service';

@Controller()
export class ImageController {
  constructor(
    private readonly imageService: ImageService,
    private readonly logger: LoggerService,
  ) {}

  @EventPattern('image.upload')
  async handleImageUpload(@Payload() data: { propertyId: string; url: string; caption?: string; }) {
    this.logger.debug('Received image upload event', 'ImageController', data);
    return await this.imageService.create(data.propertyId, { url: data.url, caption: data.caption });
  }
}