import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation, Context, ResolveField, Parent } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewService } from './review.service';
import { Review as ReviewEntity } from './entities/review.entity';
import { Review as ReviewType, ReviewConnection, CreateReviewInput } from '../graphql';
import { DataLoaderService } from '../data-loader/data-loader.service';
import { PropertyService } from '../property/property.service';
import { UserService } from '../user/user.service';
@Resolver(() => ReviewType)
export class ReviewResolver {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly dataLoader: DataLoaderService,
    private readonly propertyService: PropertyService,
    private readonly userService: UserService
  ) {}

  @ResolveField()
  property(@Parent() review: ReviewEntity) {
    return this.dataLoader.propertiesLoader.load(review.propertyId);
  }

  @ResolveField()
  user(@Parent() review: ReviewEntity) {
    return this.dataLoader.usersLoader.load(review.userId);
  }

  @Query(() => ReviewConnection, { nullable: true })
  async propertyReviews(
    @Args('propertyId') propertyId: string,
    @Args('after', { nullable: true }) after?: string,
    @Args('before', { nullable: true }) before?: string,
    @Args('first', { nullable: true }) first?: number,
    @Args('last', { nullable: true }) last?: number,
  ) {
    return this.reviewService.findByPropertyId({
      propertyId,
      after,
      before,
      first,
      last,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ReviewType)
  async addReview(
    @Args('propertyId') propertyId: string,
    @Args('input') input: CreateReviewInput,
    @Context() context,
  ): Promise<ReviewType> {
    const userId = context.req.user.id;
    const review = await this.reviewService.create(propertyId, input, userId);
    
    // Transform the entity to match the GraphQL type
    return {
      ...review,
      property: this.propertyService.toGraphQL(review.property),
      user: this.userService.toGraphQL(review.user)  // User resolver will handle this
    };
  }
} 