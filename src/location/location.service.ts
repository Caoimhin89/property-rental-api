import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { CacheService } from '../cache/cache.service';
import Keyv from 'keyv';
import { LoggerService } from '../common/services/logger.service';
@Injectable()
export class LocationService {
  private cache: Keyv;

  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {
    this.cache = this.cacheService.getNamespacedCache('location', (60000 * 5));
  }

  async findByPropertyId(propertyId: string): Promise<Location | null> {
    const cacheKey = this.cacheService.generateCacheKey('single', propertyId);
    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit', 'LocationService', { cacheKey });
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache operation failed', 'LocationService', error);
    }
    const location = await this.locationRepository.findOne({
      where: { property: { id: propertyId } },
    });
    await this.cache.set(cacheKey, JSON.stringify(location));
    return location;
  }

  async searchLocations(searchTerm: string): Promise<Location[]> {
    const cacheKey = this.cacheService.generateCacheKey('list', { searchTerm });
    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit', 'LocationService', { cacheKey });
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache operation failed', 'LocationService', error);
    }
    const locations = await this.locationRepository
      .createQueryBuilder('location')
      .where(`location.id IN (
        SELECT * FROM search_locations(:searchTerm)
      )`, { searchTerm })
      .orderBy('similarity', 'DESC')
      .take(5)
      .getMany();
    await this.cache.set(cacheKey, JSON.stringify(locations));
    return locations;
  }
} 