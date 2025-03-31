import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationService } from '../location/location.service';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Property as PropertyEntity } from './entities/property.entity';
import { User as UserEntity } from 'user/entities/user.entity';
import { Property as PropertyType, PropertyFilter, PaginationInput, YearBuiltOperator, PropertySortField, SortOrder, PageInfo, AreaUnit, UpdatePropertyInput, UpdatePriceRuleInput, UpdateBlockedDateInput, BlockedDate } from '../graphql';
import { acresToSquareMeters, milesToKilometers, squareFeetToSquareMeters, toCursor, fromCursor } from '../common/utils';
import { CreatePropertyInput } from '../graphql';
import { BlockedDate as BlockedDateEntity } from './entities/blocked-date.entity';
import { PriceRule as PriceRuleEntity } from './entities/price-rule.entity';
import { LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { LoggerService } from '../common/services/logger.service';
import { PropertyNotFoundException, PropertyUnauthorizedException, PropertyUpdateFailedException } from './property.errors';
import { CacheService } from '../cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheSetEvent, CacheInvalidateEvent } from '../cache/cache.events';
import { Bed } from './entities/bed.entity';
import { buildPaginatedResponse } from '../common/utils';
import { Connection } from '../common/types/types';

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
  constructor(
    @InjectRepository(PropertyEntity)
    private readonly propertyRepository: Repository<PropertyEntity>,
    @InjectRepository(BlockedDateEntity)
    private readonly blockedDateRepository: Repository<BlockedDateEntity>,
    @InjectRepository(PriceRuleEntity)
    private readonly priceRuleRepository: Repository<PriceRuleEntity>,
    @InjectRepository(Bed)
    private readonly bedRepository: Repository<Bed>,
    private readonly logger: LoggerService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly locationService: LocationService,
  ) {
    this.logger.debug('PropertyService initialized', 'PropertyService');
  }

  async findById(id: string, relations?: string[]): Promise<PropertyEntity | null> {
    const cacheKey = this.cacheService.generateCacheKey('single', { id, relations });
    
    // Synchronous cache check
    const cached = await this.cacheService.get<PropertyEntity>('property', cacheKey);
    if (cached) return cached;

    const property = await this.propertyRepository.findOne({
      where: { id },
      relations
    });

    if (property) {
      // Asynchronous cache set
      this.eventEmitter.emit('cache.set', new CacheSetEvent(
        'property',
        cacheKey,
        property
      ));
    }

    return property;
  }

  async findByIds(ids: string[]): Promise<PropertyType[]> {
    const properties = await this.propertyRepository.find({
      where: { id: In(ids) },
    });
    return properties.map(property => this.toGraphQL(property));
  }

  async getFavoritesByUserId(
    userId: string,
    pagination?: PaginationInput
  ): Promise<Connection<PropertyEntity>> {
    const { first, last, after, before } = pagination || {};
    
    const query = this.propertyRepository
      .createQueryBuilder('property')
      .innerJoinAndSelect(
        'property.favoritedBy',
        'user',
        'user.id = :userId',
        { userId }
      );

    if (after) {
      const afterId = fromCursor(after);
      query.andWhere(
        'property.createdAt < (SELECT p2.created_at FROM properties p2 WHERE p2.id = :afterId)',
        { afterId }
      );
    }

    if (before) {
      const beforeId = fromCursor(before);
      query.andWhere(
        'property.createdAt > (SELECT p2.created_at FROM properties p2 WHERE p2.id = :beforeId)',
        { beforeId }
      );
    }

    const limit = (first ?? last ?? 10) + 1;
    query
      .orderBy('property.createdAt', 'DESC')
      .addOrderBy('property.id', 'DESC')
      .take(limit);

    const [properties, totalCount] = await query.getManyAndCount();

    return buildPaginatedResponse(
      properties,
      totalCount,
      limit - 1,
      (property) => toCursor(property.id)
    );
  }

  async addToFavorites(userId: string, propertyId: string): Promise<PropertyEntity> {
    const property = await this.propertyRepository.findOneOrFail({ 
      where: { id: propertyId },
      relations: ['favoritedBy'] 
    });
    
    property.favoritedBy = property.favoritedBy || [];
    property.favoritedBy.push({ id: userId } as UserEntity);
    return await this.propertyRepository.save(property);
  }

  // Remove from favorites
  async removeFromFavorites(userId: string, propertyId: string): Promise<void> {
    const property = await this.propertyRepository.findOneOrFail({ 
      where: { id: propertyId },
      relations: ['favoritedBy'] 
    });
    
    property.favoritedBy = property.favoritedBy.filter(user => user.id !== userId);
    await this.propertyRepository.save(property);
  }

  // Check if property is favorited by user
  async isFavorited(userId: string, propertyId: string): Promise<boolean> {
    const count = await this.propertyRepository
      .createQueryBuilder('property')
      .innerJoin('property.favoritedBy', 'user')
      .where('property.id = :propertyId', { propertyId })
      .andWhere('user.id = :userId', { userId })
      .getCount();
    
    return count > 0;
  }
  

  async findAll(args: {
    filter?: PropertyFilter;
    pagination?: PaginationInput;
  }): Promise<PropertyEntityConnection> {
    const cacheKey = this.cacheService.generateCacheKey('list', args);
    this.logger.debug('Finding all properties', 'PropertyService', { filter: args.filter, pagination: args.pagination });
    
    try {
      const cached = await this.cacheService.get<PropertyEntityConnection>('property', cacheKey);
      if (cached) {
        this.logger.debug('Cache hit', 'PropertyService', { cacheKey });
        return cached;
      }

      const connection = await this.executePropertyQuery(args);

      // Asynchronous cache set
      this.eventEmitter.emit('cache.set', new CacheSetEvent(
        'property',
        cacheKey,
        connection
      ));
      
      return connection;
    } catch (error) {
      this.logger.error('Cache operation failed', 'PropertyService', error);
      return await this.executePropertyQuery(args);
    }
  }

  private async executePropertyQuery(args: {
    filter?: PropertyFilter;
    pagination?: PaginationInput;
  }): Promise<PropertyEntityConnection> {
    const { filter, pagination } = args;
    const qb = this.propertyRepository.createQueryBuilder('property');

    qb.leftJoinAndSelect('property.location', 'location')
      .leftJoinAndSelect('property.amenities', 'amenities')
      .leftJoinAndSelect('property.organization', 'organization');

    if (filter) {
      this.applyFilters(qb, filter);
    }

    if (pagination) {
      this.applyPagination(qb, pagination);
    }

    const [properties, totalCount] = await qb.getManyAndCount();
    return this.createPropertyConnection(properties, totalCount, pagination);
  }

  private applyFilters(qb: SelectQueryBuilder<PropertyEntity>, filter: PropertyFilter): void {
    this.applyOrganizationFilter(qb, filter);
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

  async findByOrganizationId(
    organizationId: string,
    pagination: PaginationInput
  ) {
    const cacheKey = this.cacheService.generateCacheKey('list', { organizationId, pagination });
    try {
      const cached = await this.cacheService.get<PropertyEntityConnection>('property', cacheKey);
      if (cached) {
        this.logger.debug('Cache hit', 'PropertyService', { cacheKey });
        return cached;
      }
    } catch (error) {
      this.logger.error('Cache operation failed', 'PropertyService', error);
    }
    
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
    
    // Asynchronous cache set
    this.eventEmitter.emit('cache.set', new CacheSetEvent(
      'property',
      cacheKey,
      connection
    ));
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
  ): Promise<PriceRuleEntity[]> {
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

  async getBlockedDates(propertyId: string): Promise<BlockedDateEntity[]> {
    return this.blockedDateRepository.find({
      where: { propertyId },
      order: { startDate: 'ASC' }
    });
  }

  async getPriceRules(propertyId: string): Promise<PriceRuleEntity[]> {
    try {
      const rules = await this.priceRuleRepository.find({
        where: { propertyId },
        order: { startDate: 'ASC' }
      });
      
      this.logger.debug(`Found ${rules.length} price rules for property ${propertyId}`);
      return rules;
    } catch (error) {
      this.logger.error(`Error fetching price rules for property ${propertyId}`, error);
      return [];
    }
  }

  async getBeds(propertyId: string): Promise<Bed[]> {
    this.logger.debug('Getting beds for property', 'PropertyService', { propertyId });
    return this.bedRepository.find({
      where: { propertyId },
      order: { createdAt: 'ASC' }
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

  async getKPIsByOrganizationId(organizationId: string): Promise<{
    totalProperties: number;
    ids: string[];
  }> {
    const [properties, totalCount] = await this.propertyRepository.findAndCount({ where: { organizationId }, select: ['id'] });
    return {
      totalProperties: totalCount,
      ids: properties.map(property => property.id)
    };
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

    // Enrich location with coordinates
    const geoEnrichedLocation = (input.location?.address &&
      (!input.location?.latitude || !input.location?.longitude)) ?
      await this.locationService.enrichLocationWithCoordinates(input.location) : input.location;

    // Create property
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
      ...(input.beds && { beds: input.beds.map(bedInput => ({
        bedType: bedInput.bedType,
        bedSize: bedInput.bedSize,
        room: bedInput.room
      })) }),
      ...(geoEnrichedLocation && {
        location: {
          address: geoEnrichedLocation.address,
          postalCode: geoEnrichedLocation.postalCode,
          postalCodeSuffix: geoEnrichedLocation.postalCodeSuffix,
          city: geoEnrichedLocation.city,
          county: geoEnrichedLocation.county,
          state: geoEnrichedLocation.state,
          country: geoEnrichedLocation.country,
          latitude: geoEnrichedLocation.latitude,
          longitude: geoEnrichedLocation.longitude
        }
      }),
    } as PropertyEntity);

    const savedProperty = await this.propertyRepository.save(property);
    const { location: _, ...propertyWithoutLocation } = savedProperty;
    
    // Asynchronous cache invalidation
    this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
      'property',
      'single:*'
    ));
    this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
      'property',
      'list:*'
    ));
    
    return propertyWithoutLocation;
  }

  async createPriceRules(propertyId: string, priceRules: UpdatePriceRuleInput[]): Promise<PriceRuleEntity[]> {
    try {
      if (!priceRules.length) {
        return [];
      }

      const newRules = priceRules.map(rule => 
        this.priceRuleRepository.create({
          propertyId,
          startDate: rule.startDate,
          endDate: rule.endDate,
          price: rule.price,
          description: rule.description
        } as PriceRuleEntity)
      );

      const savedRules = await this.priceRuleRepository.save(newRules);
      this.logger.debug(`Created ${savedRules.length} new price rules for property ${propertyId}`);
      return savedRules;
    } catch (error) {
      this.logger.error('Error creating price rules', 'PropertyService', JSON.stringify({ propertyId, error }));
      throw error;
    }
  }

  async createBlockedDates(propertyId: string, blockedDates: UpdateBlockedDateInput[]): Promise<BlockedDateEntity[]> {
    try {
      if (!blockedDates.length) {
        return [];
      }

      const newDates = blockedDates.map(date => 
        this.blockedDateRepository.create({
          propertyId,
          startDate: date.startDate,
          endDate: date.endDate,
          reason: date.reason
        } as BlockedDateEntity)
      );

      const savedDates = await this.blockedDateRepository.save(newDates);
      this.logger.debug(`Created ${savedDates.length} new blocked dates for property ${propertyId}`);
      return savedDates;
    } catch (error) {
      this.logger.error('Error creating blocked dates', 'PropertyService', JSON.stringify({ propertyId, error }));
      throw error;
    }
  }

  private async updatePriceRules(propertyId: string, priceRules: UpdatePriceRuleInput[]): Promise<void> {
    try {
      // Get existing price rules
      const existingRules = await this.priceRuleRepository.find({
        where: { propertyId }
      });

      // Separate rules into categories
      const existingRuleIds = new Set(existingRules.map(rule => rule.id));
      const rulesToUpdate = priceRules.filter(rule => rule.id && existingRuleIds.has(rule.id));
      const rulesToCreate = priceRules.filter(rule => !rule.id);
      const rulesToDelete = existingRules.filter(rule => 
        !priceRules.some(newRule => newRule.id === rule.id)
      );

      // Handle updates
      if (rulesToUpdate.length) {
        await Promise.all(rulesToUpdate.map((rule: UpdatePriceRuleInput) =>
          this.priceRuleRepository.update(rule.id!, {
            startDate: rule.startDate,
            endDate: rule.endDate,
            price: rule.price,
            description: rule.description
          } as PriceRuleEntity)
        ));
        this.logger.debug(`Updated ${rulesToUpdate.length} price rules`);
      }

      // Handle creates
      if (rulesToCreate.length) {
        await this.createPriceRules(propertyId, rulesToCreate);
      }

      // Handle deletes
      if (rulesToDelete.length) {
        await this.priceRuleRepository.remove(rulesToDelete);
        this.logger.debug(`Deleted ${rulesToDelete.length} price rules`);
      }
    } catch (error) {
      this.logger.error('Error updating price rules', 'PropertyService', error);
      throw error;
    }
  }

  private async updateBlockedDates(propertyId: string, blockedDates: UpdateBlockedDateInput[]): Promise<void> {
    try {
      // Get existing blocked dates
      const existingDates = await this.blockedDateRepository.find({
        where: { propertyId }
      });

      // Separate dates into categories
      const existingDateIds = new Set(existingDates.map(date => date.id));
      const datesToUpdate = blockedDates.filter(date => date.id && existingDateIds.has(date.id));
      const datesToCreate = blockedDates.filter(date => !date.id);
      const datesToDelete = existingDates.filter(date => 
        !blockedDates.some(newDate => newDate.id === date.id)
      );

      // Handle updates
      if (datesToUpdate.length) {
        await Promise.all(datesToUpdate.map((date: UpdateBlockedDateInput) =>
          this.blockedDateRepository.update(date.id!, {
            startDate: date.startDate,
            endDate: date.endDate,
            reason: date.reason
          } as BlockedDateEntity)
        ));
        this.logger.debug(`Updated ${datesToUpdate.length} blocked dates`);
      }

      // Handle creates
      if (datesToCreate.length) {
        await this.createBlockedDates(propertyId, datesToCreate);
      }

      // Handle deletes
      if (datesToDelete.length) {
        await this.blockedDateRepository.remove(datesToDelete);
        this.logger.debug(`Deleted ${datesToDelete.length} blocked dates`);
      }
    } catch (error) {
      this.logger.error('Error updating blocked dates', 'PropertyService', error);
      throw error;
    }
  }

  async update(id: string, input: UpdatePropertyInput, user: UserEntity): Promise<PropertyEntity | null> {
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

    // Handle price rules and blocked dates updates
    if (input.priceRules) {
      await this.updatePriceRules(id, input.priceRules);
    }

    if (input.blockedDates) {
      await this.updateBlockedDates(id, input.blockedDates);
    }

    // Enrich location with coordinates
    const geoEnrichedLocation = (input.location?.address &&
      (!input.location?.latitude || !input.location?.longitude)) ?
      await this.locationService.enrichLocationWithCoordinates(input.location) : input.location;

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
        ...(geoEnrichedLocation && {
          location: {
            ...(geoEnrichedLocation.address && { address: geoEnrichedLocation.address }),
            ...(geoEnrichedLocation.postalCode && { postalCode: geoEnrichedLocation.postalCode }),
            ...(geoEnrichedLocation.postalCodeSuffix && { postalCodeSuffix: geoEnrichedLocation.postalCodeSuffix }),
            ...(geoEnrichedLocation.city && { city: geoEnrichedLocation.city }),
            ...(geoEnrichedLocation.county && { county: geoEnrichedLocation.county }),
            ...(geoEnrichedLocation.state && { state: geoEnrichedLocation.state }),
            ...(geoEnrichedLocation.country && { country: geoEnrichedLocation.country }),
            ...(geoEnrichedLocation.latitude && { latitude: geoEnrichedLocation.latitude }),
            ...(geoEnrichedLocation.longitude && { longitude: geoEnrichedLocation.longitude }),
          }
        })
      });
      const savedProperty = await this.propertyRepository.save(updatedProperty);
      if (!savedProperty) {
        throw new PropertyUpdateFailedException(id);
      }
      
      // Asynchronous cache invalidation
      this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent('property', 'single:*'));
      this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent('property', 'list:*'));

      // Return property
      return savedProperty;

    } catch (error: any) {
      this.logger.error('Error updating property', 'PropertyService', error);
      throw error;
    }
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.propertyRepository.delete(id);
    if (result.affected) {
      // Asynchronous cache invalidation
      this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
        'property',
        'single:*'
      ));
      this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
        'property',
        'list:*'
      ));
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

  private applyOrganizationFilter(
    qb: SelectQueryBuilder<PropertyEntity>,
    filter: PropertyFilter
  ): void {
    if (filter.organizationIds) {
      qb.andWhere('property.organization_id IN (:...organizationIds)', {
        organizationIds: filter.organizationIds
      });
    }
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
    if (filter.numBedrooms?.min) {
      qb.andWhere('property.numBedrooms >= :minBedrooms', {
        minBedrooms: filter.numBedrooms.min
      });
    }
    if (filter.numBathrooms?.max) {
      qb.andWhere('property.numBathrooms <= :maxBathrooms', {
        maxBathrooms: filter.numBathrooms.max
      });
    } else if (typeof filter.numBathrooms === 'number') {
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
} 