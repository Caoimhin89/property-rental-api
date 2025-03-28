import { Resolver, ResolveField, Parent, Args, Query, createUnionType } from '@nestjs/graphql';
import { NearbyPlace as NearbyPlaceEntity } from './entities/nearby-place.entity';
import { Location as LocationEntity } from '../location/entities/location.entity';
import { NearbyPlaceService } from '../nearby-place/nearby-place.service';
import { Injectable } from '@nestjs/common';
import { LocationService } from '../location/location.service';

@Injectable()
@Resolver('NearbyPlace')
export class LocationResolver {
  constructor(
    private readonly nearbyPlaceService: NearbyPlaceService,
    private readonly locationService: LocationService,
  ) {}

  @ResolveField()
  location(@Parent() nearbyPlace: NearbyPlaceEntity) {
    return this.locationService.findByNearbyPlaceId(nearbyPlace.id);
  }
} 