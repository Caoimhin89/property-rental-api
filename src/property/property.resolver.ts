import { Args, Query, Resolver, ResolveField, Parent, Mutation } from '@nestjs/graphql';
import { CacheControl } from 'nestjs-gql-cache-control';
import { PropertyService } from './property.service';
import { DataLoaderService } from '../data-loader/data-loader.service';
import {
  CreatePropertyInput,
  Property,
  PropertyConnection,
  PropertyFilter,
  Location,
  PaginationInput,
  ImageConnection,
  UpdatePropertyInput } from '../graphql';
import { Property as PropertyEntity } from './entities/property.entity';
import { BookingService } from '../booking/booking.service';
import { LocationService } from '../location/location.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from 'auth/current-user.decorator';
import { User } from 'user/entities/user.entity';
import { OrganizationService } from 'organization/organization.service';
@Resolver(() => Property)
export class PropertyResolver {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly dataLoader: DataLoaderService,
    private readonly bookingService: BookingService,
    private readonly locationService: LocationService,
    private readonly organizationService: OrganizationService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Property)
  async createProperty(@Args('input') input: CreatePropertyInput) {
    return await this.propertyService.create(input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Property)
  async updateProperty(
    @Args('id') id: string,
    @Args('input') input: UpdatePropertyInput,
    @CurrentUser() user: User
  ) {
    return await this.propertyService.update(id, input, user);
  }

  @Query(() => Property, { nullable: true })
  @CacheControl({ maxAge: 10 })
  async propertyById(@Args('id') id: string) {
    return await this.propertyService.findById(id) as PropertyEntity | null;
  }

  @ResolveField()
  @CacheControl({ inheritMaxAge: true })
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
  @CacheControl({ inheritMaxAge: true })
  async reviews(@Parent() property: Property) {
    return this.dataLoader.reviewsLoader.load(property.id);
  }

  @ResolveField(() => Location)
  @CacheControl({ inheritMaxAge: true })
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

  @Query(() => PropertyConnection, { nullable: true })
  @CacheControl({ maxAge: 10 })
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

  @ResolveField()
  @CacheControl({ inheritMaxAge: true })
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
  @CacheControl({ inheritMaxAge: true })
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
  @CacheControl({ inheritMaxAge: true })
  async blockedDates(@Parent() property: Property) {
    return this.propertyService.getBlockedDates(property.id);
  }

  @ResolveField()
  @CacheControl({ inheritMaxAge: true })
  async priceRules(@Parent() property: Property) {
    return this.propertyService.getPriceRules(property.id);
  }

  @ResolveField()
  @CacheControl({ inheritMaxAge: true })
  async organization(@Parent() property: PropertyEntity) {
    return this.organizationService.findById(property.organizationId);
  }

  @ResolveField()
  @CacheControl({ inheritMaxAge: true })
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
    return this.dataLoader.nearbyPlacesLoader.load(
      location,
      pagination,
      radiusInMi,
      radiusInKm);
  }
}