import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { NearbyPlace } from './entities/nearby-place.entity';
import { NearbyPlaceConnection, NearbyPlaceEdge } from '../graphql';
import { milesToKilometers, toCursor, fromCursor, buildPaginatedResponse } from '../common/utils';
import { Location as LocationEntity } from 'location/entities/location.entity';
import { PaginationInput } from '../graphql';
import { Connection } from '../common/types/types';

@Injectable()
export class NearbyPlaceService {
  constructor(
    @InjectRepository(NearbyPlace)
    private placeRepository: Repository<NearbyPlace>,
  ) {}

  async findWithinRadiusOfLocation(
    location: LocationEntity,
    paginationArgs?: PaginationInput,
    radiusInMi?: number,
    radiusInKm?: number
  ): Promise<Connection<NearbyPlace>> {
    const { after, before, first, last } = paginationArgs || {};

    // Default radius is 10 km, override if provided
    let radiusInKmValue = radiusInKm ?? 10;
    if (radiusInMi) {
      radiusInKmValue = milesToKilometers(radiusInMi);
    }

    // Convert km to meters for PostGIS
    const radiusInMeters = radiusInKmValue * 1000;

    const qb = this.placeRepository
      .createQueryBuilder('place')
      .innerJoinAndSelect('place.location', 'loc')
      .select([
        'place.id',
        'place.name',
        'place.type',
        'place.distance',
        'place.createdAt',
        'place.updatedAt',
        'loc'
      ])
      .addSelect(
        `ST_Distance(
          ST_SetSRID(ST_MakePoint(:sourceLong, :sourceLat), 4326)::geography,
          loc.coordinates::geography
        )`,
        'calculated_distance'
      )
      .setParameters({
        sourceLat: location.latitude,
        sourceLong: location.longitude,
        radius: radiusInMeters
      })
      .where(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(:sourceLong, :sourceLat), 4326)::geography,
          loc.coordinates::geography,
          :radius
        )`
      )
      .orderBy('calculated_distance', 'ASC')
      .addOrderBy('place.id', 'ASC');

    if (after) {
      qb.andWhere('place.id > :after', { after: fromCursor(after) });
    }

    if (before) {
      qb.andWhere('place.id < :before', { before: fromCursor(before) });
    }

    const limit = (first ?? last ?? 10) + 1;
    qb.take(limit);

    const [places, totalCount] = await qb.getManyAndCount();

    return buildPaginatedResponse(
      places,
      totalCount,
      limit - 1,
      (place) => toCursor(place.id)
    );
  }
  

  async findByPropertyId(
    propertyId: string,
    after?: string,
    before?: string,
    first?: number,
    last?: number
  ): Promise<NearbyPlaceConnection | null> {
    const qb = this.placeRepository.createQueryBuilder('place')
      .leftJoinAndSelect('place.location', 'location')
      .where('place.property_id = :propertyId', { propertyId })
      .orderBy('place.distance', 'ASC');

    if (after) {
      qb.andWhere('place.distance > (SELECT distance FROM nearby_places WHERE id = :after)', { after });
    }

    if (before) {
      qb.andWhere('place.distance < (SELECT distance FROM nearby_places WHERE id = :before)', { before });
    }

    if (first) {
      qb.take(first + 1);
    } else if (last) {
      qb.orderBy('place.distance', 'DESC')
        .take(last + 1);
    }

    const [places, totalCount] = await qb.getManyAndCount();
    let hasNextPage = false;
    let hasPreviousPage = false;

    if (first && places.length > first) {
      hasNextPage = true;
      places.pop(); // Remove the extra item
    } else if (last && places.length > last) {
      hasPreviousPage = true;
      places.pop(); // Remove the extra item
    }

    const orderedPlaces = last ? places.reverse() : places;

    const edges: NearbyPlaceEdge[] = orderedPlaces.map(place => ({
      cursor: toCursor(place.id),
      node: {
        ...place,
        location: {
          ...place.location,
          coordinates: {
            latitude: place.location.latitude,
            longitude: place.location.longitude
          }
        }
      },
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null,
      },
      totalCount,
    };
  }
} 