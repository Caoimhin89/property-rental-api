import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/services/logger.service';
import axios from 'axios';
import { CacheService } from '../../cache/cache.service';
import { CacheSetEvent } from '../../cache/cache.events';
import { EventEmitter2 } from '@nestjs/event-emitter';

type NullableString = string | null;
interface GeocodeResponse {
  features: Array<{
    geometry: {
      coordinates: [number, number]; // [longitude, latitude]
    };
  }>;
}

@Injectable()
export class GeocodingService {
  private readonly mapboxToken: string;
  private readonly baseUrl = 'https://api.mapbox.com/search/geocode/v6/forward';
  private readonly cacheTtl = 60 * 60 * 24 * 30; // 30 days
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.mapboxToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN') || '';
    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_ACCESS_TOKEN not set', 'GeocodingService');
    }
  }

  async geocodeAddress(address: {
    address?: NullableString;
    city?: NullableString;
    state?: NullableString;
    country?: NullableString;
    postalCode?: NullableString;
  }): Promise<{ latitude: number; longitude: number } | null> {
    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_ACCESS_TOKEN not set', 'GeocodingService');
      return null;
    }

    const cacheKey = this.cacheService.generateCacheKey('geocode', `${address.address}:${address.city}:${address.state}:${address.country}:${address.postalCode}`);
    const cachedResult = await this.cacheService.get('geocode', cacheKey) as { latitude: number; longitude: number } | null;
    if (cachedResult) {
      this.logger.log('Cache hit', 'GeocodingService', { cacheKey });
      return cachedResult;
    }

    try {
      const params = new URLSearchParams({
        access_token: this.mapboxToken,
        autocomplete: 'false',
        limit: '1',
      });

      if (address.address) {
        // Split address into number and street
        const [number, ...streetParts] = address.address.split(' ');
        if (!isNaN(Number(number))) {
          params.append('address_number', number);
          params.append('street', streetParts.join(' '));
        } else {
          params.append('address_line1', address.address);
        }
      }
      if (address.city) params.append('place', address.city);
      if (address.state) params.append('region', address.state);
      if (address.country) params.append('country', address.country);
      if (address.postalCode) params.append('postcode', address.postalCode);

      const response = await axios.get<GeocodeResponse>(`${this.baseUrl}?${params.toString()}`);

      if (response.data.features.length === 0) {
        this.logger.warn('No geocoding results found', 'GeocodingService', { address });
        return null;
      }

      const [longitude, latitude] = response.data.features[0].geometry.coordinates;

      // emit cache event
      this.eventEmitter.emit('cache.set', new CacheSetEvent(
        'geocode',
        cacheKey,
        { latitude, longitude },
        this.cacheTtl
      ));

      return { latitude, longitude };
    } catch (error) {
      this.logger.error('Error geocoding address', 'GeocodingService', error);
      return null;
    }
  }
} 