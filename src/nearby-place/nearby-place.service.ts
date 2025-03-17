import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { NearbyPlace } from './entities/nearby-place.entity';
import { NearbyPlaceConnection, NearbyPlaceEdge } from '../graphql';
import { milesToKilometers, toCursor } from '../common/utils';
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
      .innerJoin('place.location', 'location')
      .where(`
        ST_DWithin(
          location.coordinates::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )
      `, {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: radiusInMeters
      })
      .orderBy('ST_Distance(location.coordinates, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))', 'ASC');

    // Handle cursor-based pagination
    if (after) {
      qb.andWhere(`
        ST_Distance(location.coordinates, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) > 
        (SELECT ST_Distance(l2.coordinates, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))
         FROM nearby_places np2
         INNER JOIN locations l2 ON l2.nearby_place_id = np2.id
         WHERE np2.id = :after)
      `, { after });
    }

    if (before) {
      qb.andWhere(`
        ST_Distance(location.coordinates, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) <
        (SELECT ST_Distance(l2.coordinates, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))
         FROM nearby_places np2
         INNER JOIN locations l2 ON l2.nearby_place_id = np2.id
         WHERE np2.id = :before)
      `, { before });
    }

    // Get one extra item to determine if there are more pages
    const limit = (first ?? last ?? 10) + 1;
    qb.take(limit);

    if (last) {
      qb.orderBy('ST_Distance(location.coordinates, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))', 'DESC');
    }

    const [places, totalCount] = await qb.getManyAndCount();
    let hasNextPage = false;
    let hasPreviousPage = false;

    // Remove the extra item and set hasNextPage/hasPreviousPage
    if (places.length > (first ?? last ?? 10)) {
      if (first) {
        hasNextPage = true;
        places.pop();
      } else if (last) {
        hasPreviousPage = true;
        places.pop();
      }
    }

    // Reverse the results if we're paginating from the end
    const orderedPlaces = last ? places.reverse() : places;

    const edges = orderedPlaces.map(place => ({
      cursor: toCursor(place.id),
      node: place,
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
      totalCount,
    };
  }
  

  async findByPropertyId(
    propertyId: string,
    after?: string,
    before?: string,
    first?: number,
    last?: number
  ): Promise<NearbyPlaceConnection | null> {
    const qb = this.placeRepository.createQueryBuilder('place')
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
      node: place,
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