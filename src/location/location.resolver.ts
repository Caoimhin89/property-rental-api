import { Resolver, ResolveField, Parent, Args, Query, createUnionType } from '@nestjs/graphql';
import { Location as LocationEntity } from './entities/location.entity';
import { NearbyPlaceService } from '../nearby-place/nearby-place.service';
import { Injectable } from '@nestjs/common';
import {
  GeocodeInput, 
  GeocodeResponse,
  GeocodeSuccessResponse,
  GeocodeErrorResponse, 
  LocationSuggestion,
  LocationSuggestionsInput
} from '../graphql';
import { LocationService } from './location.service';

const GeocodeResponseUnion = createUnionType({
  name: 'GeocodeResponse',
  types: () => [GeocodeSuccessResponse, GeocodeErrorResponse],
});

@Injectable()
@Resolver('Location')
export class LocationResolver {
  constructor(
    private readonly nearbyPlaceService: NearbyPlaceService,
    private readonly locationService: LocationService,
  ) {}

  @Query(() => GeocodeResponseUnion)
  async geocode(@Args('input', { type: () => GeocodeInput }) input: GeocodeInput): Promise<GeocodeResponse> {
    const location = await this.locationService.enrichLocationWithCoordinates(input);
    if (!location || location.latitude === 0 || location.longitude === 0) {
      const errorResponse: GeocodeErrorResponse = {
        __typename: 'GeocodeErrorResponse',
        error: 'Could not geocode address'
      };
      return errorResponse;
    }
    const successResponse: GeocodeSuccessResponse = {
      __typename: 'GeocodeSuccessResponse',
      latitude: location.latitude || 0,
      longitude: location.longitude || 0
    };
    return successResponse;
  }

  @Query(() => [LocationSuggestion])
  async locationSuggestions(@Args('input', { type: () => LocationSuggestionsInput }) input: LocationSuggestionsInput): Promise<LocationSuggestion[]> {
    return this.locationService.parseLocationsFromSuggestions(await this.locationService.getLocationSuggestions(input));
  }

  @ResolveField()
  coordinates(@Parent() location: LocationEntity) {
    console.log('coordinates field resolver called for Location:', location.id);
    return {
      latitude: location.latitude,
      longitude: location.longitude
    };
  }
} 