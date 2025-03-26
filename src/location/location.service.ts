import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { CacheService } from '../cache/cache.service';
import { LoggerService } from '../common/services/logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheSetEvent, CacheInvalidateEvent } from '../cache/cache.events';
import { GeocodingService, LocationSuggestion } from './services/geocoding.service';
import { CreateLocationInput, LocationSuggestionsInput, UpdateLocationInput, LocationSuggestion as LocationSuggestionType } from '../graphql';
@Injectable()
export class LocationService {
  private readonly NAMESPACE = 'location';
  private readonly TTL = 60000 * 5; // 5 minutes

  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter2,
    private readonly geocodingService: GeocodingService,
  ) {}

  async findByPropertyId(propertyId: string): Promise<Location | null> {
    const cacheKey = this.cacheService.generateCacheKey('single', propertyId);
    
    // Synchronous cache check
    const cached = await this.cacheService.get<Location>(this.NAMESPACE, cacheKey);
    if (cached) {
      this.logger.debug('Cache hit', 'LocationService', { cacheKey });
      return cached;
    }

    const location = await this.locationRepository.findOne({
      where: { property: { id: propertyId } },
    });

    if (location) {
      // Asynchronous cache set
      this.eventEmitter.emit('cache.set', new CacheSetEvent(
        this.NAMESPACE,
        cacheKey,
        location,
        this.TTL
      ));
    }

    return location;
  }

  async searchLocations(searchTerm: string): Promise<Location[]> {
    const cacheKey = this.cacheService.generateCacheKey('list', { searchTerm });
    
    // Synchronous cache check
    const cached = await this.cacheService.get<Location[]>(this.NAMESPACE, cacheKey);
    if (cached) {
      this.logger.debug('Cache hit', 'LocationService', { cacheKey });
      return cached;
    }

    const locations = await this.locationRepository
      .createQueryBuilder('location')
      .where(`location.id IN (
        SELECT * FROM search_locations(:searchTerm)
      )`, { searchTerm })
      .orderBy('similarity', 'DESC')
      .take(5)
      .getMany();

    if (locations.length > 0) {
      // Asynchronous cache set
      this.eventEmitter.emit('cache.set', new CacheSetEvent(
        this.NAMESPACE,
        cacheKey,
        locations,
        this.TTL
      ));
    }

    return locations;
  }

  // Method to invalidate location cache (call this when locations are updated)
  async invalidateCache(propertyId?: string) {
    if (propertyId) {
      // Invalidate specific location
      this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
        this.NAMESPACE,
        `single:${propertyId}`
      ));
    }
    
    // Invalidate all search results
    this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
      this.NAMESPACE,
      'list:*'
    ));
  }

  // Method to merge location data with coordinates
  async enrichLocationWithCoordinates(
    location: CreateLocationInput | UpdateLocationInput | null
  ): Promise<CreateLocationInput | UpdateLocationInput | null> {
    if (!location || (location.latitude && location.longitude)) {
      return location;
    }

    const coordinates = await this.geocodingService.geocodeAddress({
      address: location.address,
      city: location.city,
      state: location.state,
      country: location.country,
      postalCode: location.postalCode,
    });

    if (coordinates) {
      return {
        ...location,
        ...coordinates,
      };
    }

    this.logger.warn(
      'Could not geocode address, proceeding without coordinates',
      'LocationService',
      { location }
    );
    
    return location;
  }

  async getLocationSuggestions(input: LocationSuggestionsInput): Promise<LocationSuggestion[]> {
    return await this.geocodingService.getLocationSuggestions(input);
  }

  parseLocationsFromSuggestions(suggestions: LocationSuggestion[]): LocationSuggestionType[] {
    return suggestions.map((suggestion) => ({
      id: suggestion.mapbox_id,
      name: suggestion.name,
      address: suggestion.address || '',
      city: suggestion.context.place?.name || '',
      state: suggestion.context.region?.name || '',
      country: suggestion.context.country?.name || '',
      county: suggestion.context.district?.name || '',
      postalCode: suggestion.context.postcode?.name || '',
    }));
  }
} 