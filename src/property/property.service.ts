import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Property as PropertyEntity } from './entities/property.entity';
import { User as UserEntity } from 'user/entities/user.entity';
import { Property as PropertyType, PropertyFilter, PaginationInput, YearBuiltOperator, PropertySortField, SortOrder, PageInfo, AreaUnit, UpdatePropertyInput } from '../graphql';
import { acresToSquareMeters, milesToKilometers, squareFeetToSquareMeters, toCursor } from '../common/utils';
import { CreatePropertyInput } from '../graphql';
import { BlockedDate } from './entities/blocked-date.entity';
import { PriceRule } from './entities/price-rule.entity';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { LoggerService } from '../common/services/logger.service';
import { PropertyNotFoundException, PropertyUnauthorizedException } from './property.errors';
import { createHash } from 'crypto';
import { CacheService } from '../cache/cache.service';
import Keyv from 'keyv';

interface PropertyEntityConnection {
  edges: {
    cursor: string;
    node: PropertyEntity;
  }[];
  pageInfo: PageInfo;
  totalCount: number;
}

@Injectable()
export class PropertyService {
  private cache: Keyv;

  constructor(
    @InjectRepository(PropertyEntity)
    private readonly propertyRepository: Repository<PropertyEntity>,
    @InjectRepository(BlockedDate)
    private readonly blockedDateRepository: Repository<BlockedDate>,
    @InjectRepository(PriceRule)
    private readonly priceRuleRepository: Repository<PriceRule>,
    private readonly logger: LoggerService,
    private readonly cacheService: CacheService,
  ) {
    this.logger.debug('PropertyService initialized', 'PropertyService');
    this.cache = this.cacheService.getNamespacedCache('property', (60000 * 5));
  }

  async findById(id: string): Promise<PropertyEntity | null> {
    const cacheKey = this.cacheService.generateCacheKey('single', id);
    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const property = await this.propertyRepository.findOne({
        where: { id }
      });

      if (property) {
        await this.cache.set(cacheKey, JSON.stringify(property));
      }

      return property || null;
    } catch (error) {
      this.logger.error('Cache operation failed', 'PropertyService', error);
      return this.propertyRepository.findOne({
        where: { id }
      });
    }
  }

  async findByIds(ids: string[]): Promise<PropertyType[]> {
    const properties = await this.propertyRepository.find({
      where: { id: In(ids) },
    });
    return properties.map(property => this.toGraphQL(property));
  }

  async findAll(args: {
    filter?: PropertyFilter;
    pagination?: PaginationInput;
  }): Promise<PropertyEntityConnection> {
    const cacheKey = this.cacheService.generateCacheKey('list', args);
    
    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit', 'PropertyService', { cacheKey });
        return JSON.parse(cached);
      }

      const { filter, pagination } = args;
      const qb = this.propertyRepository.createQueryBuilder('property');

      qb.leftJoinAndSelect('property.location', 'location')
        .leftJoinAndSelect('property.amenities', 'amenities')
        .leftJoinAndSelect('property.organization', 'organization');

      if (filter) {
        this.applyPropertyTypeFilter(qb, filter);
        this.applyPriceFilter(qb, filter);
        this.applyYearBuiltFilter(qb, filter);
        this.applyRoomFilter(qb, filter);
        this.applyStoriesFilter(qb, filter);
        this.applyAreaFilter(qb, filter);
        this.applyLocationFilter(qb, filter);
        this.applyAmenitiesFilter(qb, filter);
        this.applySearchFilter(qb, filter);
        this.applySortingRules(qb, filter);
        this.applyAvailabilityFilters(qb, filter);
      }

      if (pagination) {
        this.applyPagination(qb, pagination);
      }

      const [properties, totalCount] = await qb.getManyAndCount();
      const connection = this.createPropertyConnection(properties, totalCount, pagination);

      await this.cache.set(cacheKey, JSON.stringify(connection));
      
      return connection;
    } catch (error) {
      this.logger.error('Cache operation failed', 'PropertyService', error);
      const { filter, pagination } = args;
      const qb = this.propertyRepository.createQueryBuilder('property');

      qb.leftJoinAndSelect('property.location', 'location')
        .leftJoinAndSelect('property.amenities', 'amenities')
        .leftJoinAndSelect('property.organization', 'organization');

      if (filter) {
        this.applyPropertyTypeFilter(qb, filter);
        this.applyPriceFilter(qb, filter);
        this.applyYearBuiltFilter(qb, filter);
        this.applyRoomFilter(qb, filter);
        this.applyStoriesFilter(qb, filter);
        this.applyAreaFilter(qb, filter);
        this.applyLocationFilter(qb, filter);
        this.applyAmenitiesFilter(qb, filter);
        this.applySearchFilter(qb, filter);
        this.applySortingRules(qb, filter);
        this.applyAvailabilityFilters(qb, filter);
      }

      if (pagination) {
        this.applyPagination(qb, pagination);
      }

      const [properties, totalCount] = await qb.getManyAndCount();
      return this.createPropertyConnection(properties, totalCount, pagination);
    }
  }

  async findByOrganizationId(
    organizationId: string,
    pagination: PaginationInput
  ) {
    const { after, before, first, last } = pagination;
    const qb = this.propertyRepository.createQueryBuilder('property')
      .where('property.organization_id = :organizationId', { organizationId })
      .orderBy('property.created_at', 'DESC');

    if (after) {
      qb.andWhere('property.created_at < (SELECT created_at FROM properties WHERE id = :after)', { after });
    }

    if (before) {
      qb.andWhere('property.created_at > (SELECT created_at FROM properties WHERE id = :before)', { before });
    }

    const [properties, totalCount] = await qb.getManyAndCount();
    // Always return a valid connection, even if empty
    const connection = this.createPropertyConnection(properties || [], totalCount, { first, last });
    return connection;
  }

  async hasBlockedDatesInRange(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const count = await this.blockedDateRepository.count({
      where: {
        propertyId,
        startDate: LessThanOrEqual(endDate),
        endDate: MoreThanOrEqual(startDate)
      }
    });
    return count > 0;
  }

  async getPriceRulesInRange(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PriceRule[]> {
    return this.priceRuleRepository.find({
      where: {
        propertyId,
        startDate: LessThanOrEqual(endDate),
        endDate: MoreThanOrEqual(startDate)
      },
      order: {
        startDate: 'ASC'
      }
    });
  }

  async getBlockedDates(propertyId: string): Promise<BlockedDate[]> {
    return this.blockedDateRepository.find({
      where: { propertyId },
      order: { startDate: 'ASC' }
    });
  }

  async getPriceRules(propertyId: string): Promise<PriceRule[]> {
    return this.priceRuleRepository.find({
      where: { propertyId },
      order: { startDate: 'ASC' }
    });
  }

  async findByOrganizationIds(organizationIds: readonly string[], pagination: PaginationInput) {
    const { after, before, first, last } = pagination;
    const qb = this.propertyRepository.createQueryBuilder('property')
      .where('property.organization_id IN (:...organizationIds)', { organizationIds });

    if (after) {
      qb.andWhere('property.created_at < (SELECT created_at FROM properties WHERE id = :after)', { after });
    }

    if (before) {
      qb.andWhere('property.created_at > (SELECT created_at FROM properties WHERE id = :before)', { before });
    }

    const [properties, totalCount] = await qb.getManyAndCount();

    // Group by organization ID first
    return organizationIds.map(orgId => {
      const orgProperties = properties.filter(p => p.organizationId === orgId);
      return this.createPropertyConnection(orgProperties, totalCount, pagination);
    });
  }

  async findByAmenityId(amenityId: string): Promise<PropertyEntity[]> {
    return this.propertyRepository
      .createQueryBuilder('property')
      .innerJoin('property_amenities', 'pa', 'pa.property_id = property.id')
      .where('pa.amenity_id = :amenityId', { amenityId })
      .getMany();
  }

  // MUTATIONS
  async create(input: CreatePropertyInput): Promise<PropertyEntity> {
    const areaInSquareMeters = input.areaUnit === AreaUnit.SQUARE_METERS ? input.area : squareFeetToSquareMeters(input.area);
    const lotSizeInSquareMeters = input.lotSizeUnit === AreaUnit.SQUARE_METERS ? input.lotSize : squareFeetToSquareMeters(input.lotSize);
    const property = this.propertyRepository.create({
      name: input.name,
      organizationId: input.organizationId,
      maxOccupancy: input.maxOccupancy,
      ...(input.description && { description: input.description }),
      basePrice: input.basePrice,
      propertyType: input.propertyType,
      images: input.images,
      numBathrooms: input.numBathrooms,
      numBedrooms: input.numBedrooms,
      numStories: input.numStories,
      garageSpaces: input.garageSpaces,
      yearBuilt: input.yearBuilt,
      areaInSquareMeters: areaInSquareMeters,
      lotSizeInSquareMeters: lotSizeInSquareMeters,
      ...(input.location && {
        location: {
          address: input.location.address,
          postalCode: input.location.postalCode,
          postalCodeSuffix: input.location.postalCodeSuffix,
          city: input.location.city,
          county: input.location.county,
          state: input.location.state,
          country: input.location.country,
          latitude: input.location.latitude,
          longitude: input.location.longitude
        }
      }),
    } as PropertyEntity);

    const savedProperty = await this.propertyRepository.save(property);
    const { location: _, ...propertyWithoutLocation } = savedProperty;
    
    await this.invalidatePropertyCache();
    
    return propertyWithoutLocation;
  }

  async update(id: string, input: UpdatePropertyInput, user: UserEntity): Promise<PropertyEntity> {
    // Check if property exists
    let property: PropertyEntity;
    try {
      property = await this.propertyRepository.findOneOrFail({ where: { id } });
    } catch (error: any) {
      this.logger.error('Error updating property', 'PropertyService', error);
      throw new PropertyNotFoundException(id);
    }

    // Check if user is authorized to update property
    if (user.organizationMembership.organizationId !== property.organizationId) {
      throw new PropertyUnauthorizedException();
    }

    // Update property
    try {
      const updatedProperty = this.propertyRepository.merge(property, {
        ...(input.name && { name: input.name }),
        ...(input.description && { description: input.description }),
        ...(input.maxOccupancy && { maxOccupancy: input.maxOccupancy }),
        ...(input.propertyType && { propertyType: input.propertyType }),
        ...(input.basePrice && { basePrice: input.basePrice }),
        ...(input.numBathrooms && { numBathrooms: input.numBathrooms }),
        ...(input.numBedrooms && { numBedrooms: input.numBedrooms }),
        ...(input.numStories && { numStories: input.numStories }),
        ...(input.garageSpaces && { garageSpaces: input.garageSpaces }),
        ...(input.yearBuilt && { yearBuilt: input.yearBuilt }),
        ...(input.area && { areaInSquareMeters: input.area }),
        ...(input.lotSize && { lotSizeInSquareMeters: input.lotSize }),
        ...(input.location && {
          location: {
            ...(input.location.address && { address: input.location.address }),
            ...(input.location.postalCode && { postalCode: input.location.postalCode }),
            ...(input.location.postalCodeSuffix && { postalCodeSuffix: input.location.postalCodeSuffix }),
            ...(input.location.city && { city: input.location.city }),
            ...(input.location.county && { county: input.location.county }),
            ...(input.location.state && { state: input.location.state }),
            ...(input.location.country && { country: input.location.country }),
            ...(input.location.latitude && { latitude: input.location.latitude }),
            ...(input.location.longitude && { longitude: input.location.longitude }),
          }
        }),
        ...(input.blockedDates && { blockedDates: input.blockedDates.map(blockedDate => ({
          ...blockedDate,
          ...(blockedDate.id && { id: blockedDate.id }),
          ...(blockedDate.startDate && { startDate: blockedDate.startDate }),
          ...(blockedDate.endDate && { endDate: blockedDate.endDate }),
          ...(blockedDate.reason && { reason: blockedDate.reason })
        })) }),
        ...(input.priceRules && { priceRules: input.priceRules.map(priceRule => ({
            ...priceRule,
            ...(priceRule.id && { id: priceRule.id }),
            ...(priceRule.startDate && { startDate: priceRule.startDate }),
            ...(priceRule.endDate && { endDate: priceRule.endDate }),
            ...(priceRule.price && { price: priceRule.price }),
            ...(priceRule.description && { description: priceRule.description })
          }))
        })
      });
      const savedProperty = await this.propertyRepository.save(updatedProperty);
      await this.invalidatePropertyCache(id);
      return savedProperty;
    } catch (error: any) {
      this.logger.error('Error updating property', 'PropertyService', error);
      throw error;
    }
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.propertyRepository.delete(id);
    if (result.affected) {
      await this.invalidatePropertyCache(id);
    }
    return result.affected ? result.affected > 0 : false;
  }

  // UTILITIES

  async calculateTotalPrice(propertyId: string, startDate: Date, endDate: Date): Promise<number> {
    const property = await this.propertyRepository.findOneOrFail({ where: { id: propertyId } });
    const priceRules = await this.getPriceRulesInRange(propertyId, startDate, endDate);

    let totalPrice = 0;
    let currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);

    while (currentDate < endDateTime) {
      const applicableRule = priceRules.find(
        rule =>
          currentDate >= new Date(rule.startDate) &&
          currentDate <= new Date(rule.endDate)
      );

      totalPrice += applicableRule ? Number(applicableRule.price) : Number(property.basePrice);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalPrice;
  }

  toGraphQL(property: PropertyEntity): PropertyType {
    return property as unknown as PropertyType;
  }

  // Private methods

  private createPropertyConnection(
    properties: PropertyEntity[],
    totalCount: number,
    pagination?: PaginationInput) {
    const { first, last } = pagination || { first: undefined, last: undefined };
    let hasNextPage = false;
    let hasPreviousPage = false;
    let resultProperties = [...properties];

    if (first && properties.length > first) {
      hasNextPage = true;
      resultProperties = properties.slice(0, first);
    } else if (last && properties.length > last) {
      hasPreviousPage = true;
      resultProperties = properties.slice(-last);
    }

    const edges = properties.length > 0 ? resultProperties.map(property => ({
      cursor: toCursor(property.id),
      node: property  // Return raw PropertyEntity
    })) : [];

    const connection = {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null
      },
      totalCount,
    };
    // this.logger.debug('PropertyConnection', 'PropertyService', { connection });

    return connection;
  }

  private applyStoriesFilter(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (filter.numStories?.min) {
      qb.andWhere('property.numStories >= :minStories', {
        minStories: filter.numStories.min
      });
    }
    if (filter.numStories?.max) {
      qb.andWhere('property.numStories <= :maxStories', {
        maxStories: filter.numStories.max
      });
    }
    if (filter.numStories?.equals) {
      qb.andWhere('property.numStories = :numStories', {
        numStories: filter.numStories.equals
      });
    }
  }

  private applyRoomFilter(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (filter.numBedrooms) {
      qb.andWhere('property.numBedrooms >= :minBedrooms', {
        minBedrooms: filter.numBedrooms.min
      });
    }
    if (filter.numBathrooms) {
      qb.andWhere('property.numBathrooms >= :minBathrooms', {
        minBathrooms: filter.numBathrooms
      });
    }
    if (filter.garageSpaces) {
      qb.andWhere('property.garageSpaces >= :minGarageSpaces', {
        minGarageSpaces: filter.garageSpaces
      });
    }
  }

  private applyAreaFilter(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (filter.area) {
      const { min, max, unit } = filter.area;

      let minArea: number | undefined;
      let maxArea: number | undefined;
      if (min) {
        if (unit === AreaUnit.SQUARE_METERS) {
          minArea = min;
        } else if (unit === AreaUnit.SQUARE_FEET) {
          minArea = squareFeetToSquareMeters(min);
        } else if (unit === AreaUnit.ACRES) {
          minArea = acresToSquareMeters(min);
        }
        qb.andWhere('property.areaInSquareMeters >= :minArea', { minArea });
      } else if (max) {
        if (unit === AreaUnit.SQUARE_METERS) {
          maxArea = max;
        } else if (unit === AreaUnit.SQUARE_FEET) {
          maxArea = squareFeetToSquareMeters(max);
        } else if (unit === AreaUnit.ACRES) {
          maxArea = acresToSquareMeters(max);
        }
        qb.andWhere('property.areaInSquareMeters <= :maxArea', { maxArea });
      }
    }

    if (filter.lotSize) {
      const { min, max, unit } = filter.lotSize;
      let minLotSize: number | undefined;
      let maxLotSize: number | undefined;
      if (min) {
        if (unit === AreaUnit.SQUARE_METERS) {
          minLotSize = min;
        } else if (unit === AreaUnit.SQUARE_FEET) {
          minLotSize = squareFeetToSquareMeters(min);
        } else if (unit === AreaUnit.ACRES) {
          minLotSize = acresToSquareMeters(min);
        }
        qb.andWhere('property.lotSizeInSquareMeters >= :minLotSize', { minLotSize });
      } else if (max) {
        if (unit === AreaUnit.SQUARE_METERS) {
          maxLotSize = max;
        } else if (unit === AreaUnit.SQUARE_FEET) {
          maxLotSize = squareFeetToSquareMeters(max);
        } else if (unit === AreaUnit.ACRES) {
          maxLotSize = acresToSquareMeters(max);
        }
        qb.andWhere('property.lotSizeInSquareMeters <= :maxLotSize', { maxLotSize });
      }
    }
  }

  private applyAvailabilityFilters(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (filter.availability) {
      // Exclude properties that have bookings in the date range
      qb.andWhere(qb => {
        const bookingSubQuery = qb.subQuery()
          .select('1')
          .from('bookings', 'b')
          .where('b.property_id = property.id')
          .andWhere('b.status != :cancelledStatus')
          .andWhere('b.end_date > :startDate')
          .andWhere('b.start_date < :endDate');
        return 'NOT EXISTS ' + bookingSubQuery.getQuery();
      })
        .setParameters({
          cancelledStatus: 'CANCELLED',
          startDate: filter.availability.startDate,
          endDate: filter.availability.endDate
        });

      // Exclude properties that have blocked dates in the range
      qb.andWhere(qb => {
        const blockedDatesSubQuery = qb.subQuery()
          .select('1')
          .from('blocked_dates', 'bd')
          .where('bd.property_id = property.id')
          .andWhere('bd.end_date > :startDate')
          .andWhere('bd.start_date < :endDate');
        return 'NOT EXISTS ' + blockedDatesSubQuery.getQuery();
      });
    }
  }

  private applyPropertyTypeFilter(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (filter.propertyType?.length) {
      qb.andWhere('property.propertyType IN (:...types)', {
        types: filter.propertyType
      });
    }
  }

  private applyPriceFilter(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (filter.price?.min) {
      qb.andWhere('property.basePrice >= :minPrice', {
        minPrice: filter.price.min
      });
    }
    if (filter.price?.max) {
      qb.andWhere('property.basePrice <= :maxPrice', {
        maxPrice: filter.price.max
      });
    }
  }

  private applyYearBuiltFilter(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (!filter.yearBuilt) return;

    const { operator, value, minValue, maxValue } = filter.yearBuilt;

    switch (operator) {
      case YearBuiltOperator.EQUALS:
        qb.andWhere('property.yearBuilt = :year', { year: value });
        break;
      case YearBuiltOperator.GREATER_THAN:
        qb.andWhere('property.yearBuilt > :year', { year: value });
        break;
      case YearBuiltOperator.LESS_THAN:
        qb.andWhere('property.yearBuilt < :year', { year: value });
        break;
      case YearBuiltOperator.BETWEEN:
        if (minValue && maxValue) {
          qb.andWhere('property.yearBuilt BETWEEN :minYear AND :maxYear', {
            minYear: minValue,
            maxYear: maxValue
          });
        }
        break;
    }
  }

  private applyLocationFilter(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (!filter.location) return;

    const {
      latitude,
      longitude,
      radiusInKm,
      radiusInMiles,
      city,
      county,
      state,
      country,
      postalCode,
      postalCodeSuffix,
      boundingBox
    } = filter.location;

    if (city) {
      qb.andWhere('location.city = :city', { city });
    }

    if (state) {
      qb.andWhere('location.state = :state', { state });
    }

    if (country) {
      qb.andWhere('location.country = :country', { country });
    }

    if (postalCode) {
      qb.andWhere('location.postalCode = :postalCode', { postalCode });

      // only check if postalCodeSuffix if postalCode is provided
      if (postalCodeSuffix) {
        qb.andWhere('location.postalCodeSuffix = :postalCodeSuffix', { postalCodeSuffix });
      }
    }

    if (county) {
      qb.andWhere('location.county = :county', { county });
    }


    // Radius search
    if (latitude && longitude && (radiusInKm || radiusInMiles)) {
      let radiusInMeters: number;
      if (radiusInMiles) {
        radiusInMeters = milesToKilometers(radiusInMiles) * 1000;
      } else if (radiusInKm) {
        radiusInMeters = radiusInKm * 1000;
      } else {
        throw new Error('Radius must be provided in either km or miles');
      }

      qb.andWhere(`
        ST_DWithin(
          location.coordinates::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )
      `, {
        latitude,
        longitude,
        radius: radiusInMeters
      });
    }

    // Bounding box search
    if (boundingBox) {
      qb.andWhere(`
        ST_Within(
          location.coordinates,
          ST_MakeEnvelope(
            :swLng, :swLat,
            :neLng, :neLat,
            4326
          )
        )
      `, {
        swLat: boundingBox.southWestLat,
        swLng: boundingBox.southWestLng,
        neLat: boundingBox.northEastLat,
        neLng: boundingBox.northEastLng
      });
    }
  }

  private applyAmenitiesFilter(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (!filter.amenities) return;

    const { includeAll, includeAny, exclude } = filter.amenities;

    if (includeAll?.length) {
      // Property must have ALL these amenities
      includeAll.forEach((amenity, index) => {
        qb.andWhere(qb => {
          const subQuery = qb.subQuery()
            .select('1')
            .from('amenities', `a${index}`)
            .where(`a${index}.property_id = property.id`)
            .andWhere(`a${index}.name = :amenity${index}`);
          return 'EXISTS ' + subQuery.getQuery();
        })
          .setParameter(`amenity${index}`, amenity);
      });
    }

    if (includeAny?.length) {
      // Property must have ANY of these amenities
      qb.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('1')
          .from('amenities', 'a')
          .where('a.property_id = property.id')
          .andWhere('a.name IN (:...amenities)');
        return 'EXISTS ' + subQuery.getQuery();
      })
        .setParameter('amenities', includeAny);
    }

    if (exclude?.length) {
      // Property must NOT have these amenities
      qb.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('1')
          .from('amenities', 'a')
          .where('a.property_id = property.id')
          .andWhere('a.name IN (:...excludeAmenities)');
        return 'NOT EXISTS ' + subQuery.getQuery();
      })
        .setParameter('excludeAmenities', exclude);
    }
  }

  private applySortingRules(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (!filter.sort?.length) {
      // Default sorting
      qb.orderBy('property.createdAt', 'DESC');
      return;
    }

    filter.sort.forEach((sortRule, index) => {
      const order = sortRule.order === SortOrder.ASC ? 'ASC' : 'DESC';

      switch (sortRule.field) {
        case PropertySortField.PRICE:
          qb.addOrderBy('property.basePrice', order);
          break;
        case PropertySortField.CREATED_AT:
          qb.addOrderBy('property.createdAt', order);
          break;
        case PropertySortField.YEAR_BUILT:
          qb.addOrderBy('property.yearBuilt', order);
          break;
        case PropertySortField.AREA:
          qb.addOrderBy('property.area', order);
          break;
        // Add other sort fields as needed
      }
    });
  }

  private applySearchFilter(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (filter.searchTerm) {
      qb.andWhere(
        '(property.name ILIKE :search OR property.description ILIKE :search)',
        { search: `%${filter.searchTerm}%` }
      );
    }
  }

  private applyPagination(
    qb: SelectQueryBuilder<PropertyEntity>,
    pagination: PaginationInput
  ): void {
    if (pagination) {
      const { after, before, first, last } = pagination;
      if (after) {
        qb.andWhere('property.created_at < (SELECT created_at FROM properties WHERE id = :after)', { after });
      }
      if (before) {
        qb.andWhere('property.created_at > (SELECT created_at FROM properties WHERE id = :before)', { before });
      }
      if (first) {
        qb.take(first);
      }
      if (last) {
        qb.take(last);
      }
    }
  }

  private async invalidatePropertyCache(propertyId?: string) {
    try {
      if (propertyId) {
        const propertyKey = this.cacheService.generateCacheKey('single', propertyId);
        await this.cache.delete(propertyKey);
      }
      await this.cache.delete('properties:*');
      this.logger.debug('Cache invalidated', 'PropertyService', { propertyId });
    } catch (error) {
      this.logger.error('Cache invalidation failed', 'PropertyService', error);
    }
  }
} 