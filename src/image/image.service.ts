import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image as ImageEntity } from './entities/image.entity';
import { PaginationInput, Image as ImageType } from '../graphql';
import { toCursor } from '../common/utils';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
  ) {}

  async findByPropertyId(
    propertyId: string,
    pagination?: PaginationInput
  ): Promise<any> {
    const qb = this.imageRepository.createQueryBuilder('image')
      .where('image.property_id = :propertyId', { propertyId })
      .orderBy('image.created_at', 'DESC');

    // Apply cursor pagination
    if (pagination?.after) {
      qb.andWhere(
        'image.created_at < (SELECT created_at FROM images WHERE id = :after)',
        { after: pagination.after }
      );
    }

    if (pagination?.before) {
      qb.andWhere(
        'image.created_at > (SELECT created_at FROM images WHERE id = :before)',
        { before: pagination.before }
      );
    }

    // Get one extra item to determine if there are more pages
    const limit = pagination?.first ? pagination.first + 1 : undefined;
    if (limit) {
      qb.take(limit);
    }

    const [images, totalCount] = await qb.getManyAndCount();

    // Handle pagination
    let hasNextPage = false;
    let hasPreviousPage = false;
    let resultImages = [...images];

    if (pagination?.first && images.length > pagination.first) {
      hasNextPage = true;
      resultImages = images.slice(0, pagination.first);
    }

    if (pagination?.last) {
      hasPreviousPage = true;
      resultImages = images.slice(-pagination.last);
    }

    // Create connection structure
    const edges = resultImages.map(image => ({
      cursor: toCursor(image.id),
      node: image
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null
      },
      totalCount
    };
  }

  async findById(id: string): Promise<ImageEntity | null> {
    return this.imageRepository.findOne({
      where: { id },
    });
  }

  async create(propertyId: string, input: { url: string, caption?: string }): Promise<ImageEntity> {
    const image = this.imageRepository.create({
      url: input.url,
      propertyId,
      ...(input.caption && { caption: input.caption }),
      createdAt: new Date(),
    });

    return this.imageRepository.save(image);
  }

  toGraphQL(image: ImageEntity): ImageType {
    return {
      id: image.id,
      url: image.url,
      caption: image.caption,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }
} 