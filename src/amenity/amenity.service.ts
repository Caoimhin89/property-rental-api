import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenity as AmenityEntity } from './entities/amenity.entity';
import { Property as PropertyEntity } from '../property/entities/property.entity';
import { Amenity as AmenityType, PageInfo } from '../graphql';
import { CreateAmenityInput, UpdateAmenityInput, PaginationInput } from '../graphql';
import { toCursor } from 'common/utils';

interface AmenityEntityConnection {
  edges: {
    cursor: string;
    node: AmenityEntity;
  }[];
  pageInfo: PageInfo;
  totalCount: number;
}

@Injectable()
export class AmenityService {
  constructor(
    @InjectRepository(AmenityEntity)
    private readonly amenityRepository: Repository<AmenityEntity>,
    @InjectRepository(PropertyEntity)
    private readonly propertyRepository: Repository<PropertyEntity>,
  ) {}

  async findById(id: string): Promise<AmenityEntity | null> {
    const amenity = await this.amenityRepository.findOne({
      where: { id }
    });
    return amenity;
  }

  async findAll(pagination?: PaginationInput): Promise<AmenityEntityConnection> {
    const qb = this.amenityRepository.createQueryBuilder('amenity');

    if (pagination?.after) {
      qb.andWhere('amenity.created_at < (SELECT created_at FROM amenities WHERE id = :after)', 
        { after: pagination.after }
      );
    }

    if (pagination?.before) {
      qb.andWhere('amenity.created_at > (SELECT created_at FROM amenities WHERE id = :before)', 
        { before: pagination.before }
      );
    }

    qb.orderBy('amenity.created_at', 'DESC');

    const [amenities, totalCount] = await qb.getManyAndCount();

    return this.createAmenityConnection(amenities, totalCount, pagination);
  }

  async findByPropertyId(propertyId: string): Promise<AmenityEntity[]> {
    const amenities = await this.amenityRepository
      .createQueryBuilder('amenity')
      .innerJoin('property_amenities', 'pa', 'pa.amenity_id = amenity.id')
      .where('pa.property_id = :propertyId', { propertyId })
      .orderBy('amenity.name', 'ASC')
      .getMany();

    return amenities;
  }

  async create(input: CreateAmenityInput): Promise<AmenityEntity> {
    const amenity = this.amenityRepository.create({
      name: input.name,
      category: input.category,
      icon: input.icon,
      iconUrl: input.iconUrl,
    } as AmenityEntity);
    
    const savedAmenity = await this.amenityRepository.save(amenity);
    return savedAmenity;
  }

  async update(id: string, input: UpdateAmenityInput): Promise<AmenityEntity> {
    const amenity = await this.amenityRepository.findOne({
      where: { id }
    });

    if (!amenity) {
      throw new NotFoundException(`Amenity with ID ${id} not found`);
    }

    // Update only provided fields
    if (input.name !== undefined) amenity.name = input.name!;
    if (input.category !== undefined) amenity.category = input.category!;
    if (input.icon !== undefined) amenity.icon = input.icon!;
    if (input.iconUrl !== undefined) amenity.iconUrl = input.iconUrl!;

    return await this.amenityRepository.save(amenity);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.amenityRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async addToProperty(propertyId: string, amenityId: string): Promise<PropertyEntity> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
      relations: ['amenities']
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    const amenity = await this.amenityRepository.findOne({
      where: { id: amenityId }
    });

    if (!amenity) {
      throw new NotFoundException(`Amenity with ID ${amenityId} not found`);
    }

    if (!property.amenities) {
      property.amenities = [];
    }

    // Check if amenity is already added
    if (!property.amenities.some(a => a.id === amenityId)) {
      property.amenities.push(amenity);
      await this.propertyRepository.save(property);
    }

    return property;
  }

  async removeFromProperty(propertyId: string, amenityId: string): Promise<PropertyEntity> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
      relations: ['amenities']
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    if (property.amenities) {
      property.amenities = property.amenities.filter(a => a.id !== amenityId);
      await this.propertyRepository.save(property);
    }

    return property;
  }

  toGraphQL(amenity: AmenityEntity): AmenityType {
    return {
      id: amenity.id,
      name: amenity.name,
      category: amenity.category,
      icon: amenity.icon,
      iconUrl: amenity.iconUrl,
      properties: [],
      createdAt: amenity.createdAt,
      updatedAt: amenity.updatedAt,
    };
  }

  private createAmenityConnection(
    amenities: AmenityEntity[],
    totalCount: number,
    pagination?: PaginationInput
  ): AmenityEntityConnection {
    const { first, last } = pagination || { first: undefined, last: undefined };
    let hasNextPage = false;
    let hasPreviousPage = false;
    let resultAmenities = [...amenities];

    if (first && amenities.length > first) {
      hasNextPage = true;
      resultAmenities = amenities.slice(0, first);
    } else if (last && amenities.length > last) {
      hasPreviousPage = true;
      resultAmenities = amenities.slice(-last);
    }

    const edges = amenities.length > 0 ? resultAmenities.map(amenity => ({
      cursor: toCursor(amenity.id),
      node: amenity
    })) : [];

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null
      },
      totalCount,
    };
  }
} 