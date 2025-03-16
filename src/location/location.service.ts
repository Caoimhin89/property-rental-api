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
} 