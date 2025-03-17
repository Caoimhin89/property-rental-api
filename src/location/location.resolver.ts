import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Location as LocationEntity } from './entities/location.entity';
import { NearbyPlaceService } from '../nearby-place/nearby-place.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@Resolver('Location')
export class LocationResolver {
  constructor(
    private readonly nearbyPlaceService: NearbyPlaceService
  ) {}

  @ResolveField()
  coordinates(@Parent() location: LocationEntity) {
    console.log('coordinates field resolver called for Location:', location.id);
    return {
      latitude: location.latitude,
      longitude: location.longitude
    };
  }
} 