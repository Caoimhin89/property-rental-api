import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NearbyPlace } from './entities/nearby-place.entity';
import { NearbyPlaceConnection, NearbyPlaceEdge } from '../graphql';
import { toCursor } from '../common/utils';

@Injectable()
export class NearbyPlaceService {
  constructor(
    @InjectRepository(NearbyPlace)
    private placeRepository: Repository<NearbyPlace>,
  ) {}

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