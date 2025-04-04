import { Args, Query, Resolver, ResolveField, Parent, Mutation, createUnionType } from '@nestjs/graphql';
import { PropertyService } from './property.service';
import { DataLoaderService } from '../data-loader/data-loader.service';
import {
  Error as ErrorType,
  CreatePropertyInput,
  Property,
  PropertyConnection,
  PropertyFilter,
  Location,
  PaginationInput,
  ImageConnection,
  UpdatePropertyInput,
  BookingStatus,
  CreateBlockedDateInput,
  BlockedDate,
  CreatePriceRuleInput,
  PriceRule,
  MaintenanceRequestStatus,
  MaintenanceRequestConnection,
  Amenity,
  CreateAmenityInput
} from '../graphql';
import { Property as PropertyEntity } from './entities/property.entity';
import { BookingService } from '../booking/booking.service';
import { LocationService } from '../location/location.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from 'auth/current-user.decorator';
import { User } from 'user/entities/user.entity';
import { OrganizationService } from 'organization/organization.service';
import { NearbyPlaceService } from 'nearby-place/nearby-place.service';
import { Bed as BedEntity } from './entities/bed.entity';
import { PropertyNotFoundException, PropertyUnauthorizedException } from './property.errors';
import { Logger } from '@nestjs/common';

export const PropertyResult = createUnionType({
  name: 'PropertyResult',
  types: () => [Property, ErrorType],
  resolveType(value) {
    if ('code' in value) {
      return ErrorType;
    }
    return Property;
  },
});
@Resolver(() => Property)
export class PropertyResolver {
  private readonly logger = new Logger(PropertyResolver.name);

  constructor(
    private readonly propertyService: PropertyService,
    private readonly dataLoader: DataLoaderService,
    private readonly bookingService: BookingService,
    private readonly locationService: LocationService,
    private readonly organizationService: OrganizationService,
    private readonly nearbyPlaceService: NearbyPlaceService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Property)
  async createProperty(@Args('input') input: CreatePropertyInput) {
    return await this.propertyService.create(input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => PropertyResult)
  async updateProperty(
    @Args('id') id: string,
    @Args('input') input: UpdatePropertyInput,
    @CurrentUser() user: User
  ) {
    try {
      const property = await this.propertyService.update(id, input, user);
      return {
        ...property,
        __typename: 'Property'
      };
    } catch (error) {
      if (error instanceof PropertyNotFoundException) {
        return {
          code: 'PROPERTY_NOT_FOUND',
          message: `Property with ID ${id} not found`,
          __typename: 'Error'
        } as ErrorType;
      }
      if (error instanceof PropertyUnauthorizedException) {
        return {
          code: 'UNAUTHORIZED',
          message: 'User is not authorized to update this property',
          __typename: 'Error'
        } as ErrorType;
      }
      // Handle other specific errors...
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: error.message,
        __typename: 'Error'
      } as ErrorType;
    }
  }

  @Mutation(() => Property)
  @UseGuards(JwtAuthGuard)
  async addToFavorites(
    @Args('propertyId') propertyId: string,
    @CurrentUser() user: User
  ): Promise<Property> {
    const property = await this.propertyService.addToFavorites(user.id, propertyId);
    return this.propertyService.toGraphQL(property);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Property)
  async removeFromFavorites(
    @Args('propertyId') propertyId: string,
    @CurrentUser() user: User
  ) {
    return await this.propertyService.removeFromFavorites(user.id, propertyId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => [BlockedDate])
  async createBlockedDates(
    @Args('propertyId') propertyId: string,
    @Args('input') input: CreateBlockedDateInput[]) {
    return await this.propertyService.createBlockedDates(propertyId, input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => [PriceRule])
  async createPriceRules(
    @Args('propertyId') propertyId: string,
    @Args('input') input: CreatePriceRuleInput[]) {
    return await this.propertyService.createPriceRules(propertyId, input);
  }
  
  @Query(() => Property, { nullable: true })
  async propertyById(@Args('id') id: string) {
    return await this.propertyService.findById(id) as PropertyEntity | null;
  }

  @Query(() => PropertyConnection, { nullable: true })
  async properties(
    @Args('filter', { nullable: true }) filter?: PropertyFilter,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const connection = await this.propertyService.findAll({
      filter,
      pagination
    });

    return {
      ...connection,
      edges: connection.edges.map(edge => ({
        ...edge,
        node: this.propertyService.toGraphQL(edge.node)
      }))
    };
  }

  @Query(() => PropertyConnection)
  @UseGuards(JwtAuthGuard)
  async favorites(
    @CurrentUser() user: User,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<PropertyConnection> {
    if (!user) {
      throw new UnauthorizedException('User must be authenticated to view favorites');
    }

    const connection = await this.propertyService.getFavoritesByUserId(user.id, pagination);

    return {
      ...connection,
      edges: connection.edges.map(edge => ({
        ...edge,
        node: this.propertyService.toGraphQL(edge.node)
      }))
    };
  }

  @Query(() => [Amenity])
  async propertyAmenities(@Args('propertyId') propertyId: string) {
    return this.dataLoader.amenitiesLoader.load(propertyId);
  }

  @ResolveField()
  async amenities(@Parent() property: Property) {
    return this.dataLoader.amenitiesLoader.load(property.id);
  }

  @ResolveField(() => ImageConnection)
  async images(
    @Parent() property: PropertyEntity,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ): Promise<ImageConnection> {
    return this.dataLoader.propertyImagesLoader.load(property.id, pagination);
  }

  @ResolveField()
  async reviews(@Parent() property: Property) {
    return this.dataLoader.reviewsLoader.load(property.id);
  }

  @ResolveField(() => Location)
  async location(@Parent() property: PropertyEntity) {
    console.log('Location field resolver called for property:', property.id);
    const location = await this.locationService.findByPropertyId(property.id);
    if (!location) {
      throw new Error(`Location not found for property ${property.id}`);
    }
    // Store the resolved location on the property entity
    (property as PropertyEntity)._resolvedLocation = location;
    return location;
  }

  @ResolveField()
  async isAvailable(
    @Parent() property: Property,
    @Args('startDate') startDate: Date,
    @Args('endDate') endDate: Date
  ): Promise<boolean> {
    // Check for bookings in date range
    const hasBookings = await this.bookingService.hasBookingsInRange(
      property.id,
      startDate,
      endDate
    );

    // Check for blocked dates in range
    const hasBlockedDates = await this.propertyService.hasBlockedDatesInRange(
      property.id,
      startDate,
      endDate
    );

    return !hasBookings && !hasBlockedDates;
  }

  @ResolveField()
  async priceForDates(
    @Parent() property: Property,
    @Args('startDate') startDate: Date,
    @Args('endDate') endDate: Date
  ): Promise<number> {
    return this.propertyService.calculateTotalPrice(
      property.id,
      startDate,
      endDate
    );
  }

  @ResolveField()
  async blockedDates(@Parent() property: Property) {
    return this.propertyService.getBlockedDates(property.id);
  }

  @ResolveField()
  async priceRules(@Parent() property: PropertyEntity) {
    try {
      const rules = await this.propertyService.getPriceRules(property.id);
      this.logger.debug(`Resolved ${rules.length} price rules for property ${property.id}`);
      return rules;
    } catch (error) {
      this.logger.error(`Error resolving price rules for property ${property.id}`, error);
      return [];
    }
  }

  @ResolveField()
  async beds(@Parent() property: Property) {
    return this.propertyService.getBeds(property.id) || [] as BedEntity[];
  }

  @ResolveField()
  async organization(@Parent() property: PropertyEntity) {
    return this.organizationService.findById(property.organizationId);
  }

  @ResolveField()
  async nearbyPlaces(
    @Parent() property: PropertyEntity,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('radiusInMi', { nullable: true }) radiusInMi?: number,
    @Args('radiusInKm', { nullable: true }) radiusInKm?: number
  ) {
    // Use the already resolved location if available
    const location = (property as PropertyEntity)._resolvedLocation || await this.locationService.findByPropertyId(property.id);
    if (!location) {
      throw new Error(`Location not found for property ${property.id}`);
    }
    return this.nearbyPlaceService.findWithinRadiusOfLocation(location, pagination, radiusInMi, radiusInKm);
  }

  @ResolveField()
  async bookings(
    @Parent() property: Property,
    @Args('status', { nullable: true }) status?: BookingStatus,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput) {
    return this.bookingService.findByPropertyId(property.id, status, pagination);
  }

  @ResolveField()
  async maintenanceRequests(
    @Parent() property: PropertyEntity,
    @Args('status', { nullable: true }) status?: MaintenanceRequestStatus,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ): Promise<MaintenanceRequestConnection> {
    return this.dataLoader.maintenanceRequestsLoader.load({
      propertyId: property.id,
      status,
      pagination
    });
  }
}