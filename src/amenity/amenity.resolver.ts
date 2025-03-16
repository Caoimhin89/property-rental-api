import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { Inject, forwardRef } from '@nestjs/common';
import { AmenityService } from './amenity.service';
import { PropertyService } from '../property/property.service';
import { Amenity } from './entities/amenity.entity';
import { Property } from '../property/entities/property.entity';
import { CreateAmenityInput, UpdateAmenityInput, PaginationInput, AmenityConnection } from '../graphql';

@Resolver(() => Amenity)
export class AmenityResolver {
  constructor(
    private readonly amenityService: AmenityService,
    @Inject(forwardRef(() => PropertyService))
    private readonly propertyService: PropertyService,
  ) {}

  @Query(() => Amenity, { nullable: true })
  async amenity(@Args('id') id: string): Promise<Amenity | null> {
    return this.amenityService.findById(id);
  }

  @Query(() => AmenityConnection)
  async amenities(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ): Promise<AmenityConnection> {
    const connection = await this.amenityService.findAll(pagination);
    
    return {
      edges: connection.edges.map(edge => ({
        cursor: edge.cursor,
        node: this.amenityService.toGraphQL(edge.node)
      })),
      pageInfo: connection.pageInfo,
      totalCount: connection.totalCount
    };
  }

  @Mutation(() => Amenity)
  async createAmenity(
    @Args('input') input: CreateAmenityInput
  ): Promise<Amenity> {
    return this.amenityService.create(input);
  }

  @Mutation(() => Amenity)
  async updateAmenity(
    @Args('id') id: string,
    @Args('input') input: UpdateAmenityInput
  ): Promise<Amenity> {
    return this.amenityService.update(id, input);
  }

  @Mutation(() => Boolean)
  async removeAmenity(
    @Args('id') id: string
  ): Promise<boolean> {
    return this.amenityService.remove(id);
  }

  @Mutation(() => Property)
  async addAmenityToProperty(
    @Args('propertyId') propertyId: string,
    @Args('amenityId') amenityId: string
  ): Promise<Property> {
    return this.amenityService.addToProperty(propertyId, amenityId);
  }

  @Mutation(() => Property)
  async removeAmenityFromProperty(
    @Args('propertyId') propertyId: string,
    @Args('amenityId') amenityId: string
  ): Promise<Property> {
    return this.amenityService.removeFromProperty(propertyId, amenityId);
  }

  @ResolveField(() => [Property])
  async properties(@Parent() amenity: Amenity): Promise<Property[]> {
    return this.propertyService.findByAmenityId(amenity.id);
  }
} 