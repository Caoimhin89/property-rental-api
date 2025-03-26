import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/services/logger.service';
import axios from 'axios';
import { CacheService } from '../../cache/cache.service';
import { CacheSetEvent } from '../../cache/cache.events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { LocationSuggestionsInput } from '../../graphql';

type NullableString = string | null;
interface GeocodeResponse {
  features: Array<{
    geometry: {
      coordinates: [number, number]; // [longitude, latitude]
    };
  }>;
}

export interface LocationSuggestion {
  name: string;
  mapbox_id: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  place_formatted: string;
  context: {
    country?: { name: string; country_code: string };
    region?: { name: string; region_code: string };
    postcode?: { name: string };
    place?: { name: string };
    locality?: { name: string };
    neighborhood?: { name: string };
    address?: { name: string; address_number: string; street_name: string };
    district?: { name: string };
  };
  distance?: number;
}

interface SuggestResponse {
  suggestions: LocationSuggestion[];
  attribution: string;
}

@Injectable()
export class GeocodingService {
  private readonly mapboxToken: string;
  private readonly baseUrl = 'https://api.mapbox.com/search/geocode/v6/forward';
  private readonly suggestUrl = 'https://api.mapbox.com/search/searchbox/v1/suggest';
  private readonly retrieveUrl = 'https://api.mapbox.com/search/searchbox/v1/retrieve';
  private readonly cacheTtl = 60 * 60 * 24 * 30; // 30 days
  private readonly cacheTtlSuggestions = 60 * 60 * 24 * 7; // 7 days
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

  async suggestLocations(
    query: string,
    options?: {
      limit?: number;
      proximity?: { longitude: number; latitude: number };
      country?: string;
      language?: string;
      types?: string[];
    }
  ): Promise<LocationSuggestion[]> {
    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_ACCESS_TOKEN not set', 'GeocodingService');
      return [];
    }

    const cacheKey = this.cacheService.generateCacheKey(
      'geocode-suggest',
      `${query}:${JSON.stringify(options)}`
    );

    const cachedResult = await this.cacheService.get('geocode-suggest', cacheKey) as LocationSuggestion[] | null;
    if (cachedResult) {
      this.logger.log('Cache hit for location suggestions', 'GeocodingService', { cacheKey });
      return cachedResult;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        access_token: this.mapboxToken,
        session_token: uuidv4(),
        limit: options?.limit?.toString() || '5',
      });

      if (options?.proximity) {
        params.append('proximity', `${options.proximity.longitude},${options.proximity.latitude}`);
      }
      if (options?.country) {
        params.append('country', options.country);
      }
      if (options?.language) {
        params.append('language', options.language);
      }
      if (options?.types?.length) {
        params.append('types', options.types.join(','));
      }

      const response = await axios.get<SuggestResponse>(`${this.suggestUrl}?${params.toString()}`);
      const suggestions = response.data.suggestions;

      // Cache the results
      this.eventEmitter.emit('cache.set', new CacheSetEvent(
        'geocode-suggest',
        cacheKey,
        suggestions,
        300 // Cache suggestions for 5 minutes
      ));

      return suggestions;
    } catch (error) {
      this.logger.error('Error fetching location suggestions', 'GeocodingService', error);
      return [];
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

  async getLocationSuggestions(input: LocationSuggestionsInput): Promise<LocationSuggestion[]> {

    // check cache
    const cacheKey = this.cacheService.generateCacheKey('location-suggestions', input.query);
    const cachedResult = await this.cacheService.get('location-suggestions', cacheKey) as LocationSuggestion[] | null;
    if (cachedResult) {
      this.logger.log('Cache hit', 'GeocodingService', { cacheKey });
      return cachedResult;
    }

    const suggestions = await this.suggestLocations(input.query, {
      limit: 5,
      proximity: { longitude: 0, latitude: 0 },
      country: 'US',
    });

    // cache the result
    this.eventEmitter.emit('cache.set', new CacheSetEvent(
      'location-suggestions',
      cacheKey,
      suggestions,
      this.cacheTtlSuggestions
    ));

    return suggestions;
  }
} 