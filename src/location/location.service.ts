import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {}

  async findByPropertyId(propertyId: string): Promise<Location | null> {
    return this.locationRepository.findOne({
      where: { property: { id: propertyId } },
    });
  }

  async searchLocations(searchTerm: string): Promise<Location[]> {
    return this.locationRepository
      .createQueryBuilder('location')
      .where(`location.id IN (
        SELECT * FROM search_locations(:searchTerm)
      )`, { searchTerm })
      .orderBy('similarity', 'DESC')
      .take(5)
      .getMany();
  }
} 