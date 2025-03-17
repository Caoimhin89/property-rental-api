import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { UserService } from './user.service';
import { CreateUserInput, PaginationInput, User, UserConnection } from '../graphql';
import { User as UserEntity } from './entities/user.entity';
import { BookingService } from '../booking/booking.service';
import { DataLoaderService } from '../data-loader/data-loader.service';
import { OrganizationService } from '../organization/organization.service';
@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly bookingService: BookingService,
    private readonly dataLoaderService: DataLoaderService,
    private readonly organizationService: OrganizationService
  ) {}

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    const user = await this.userService.create(input);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string): Promise<User | null> {
    const user = await this.userService.findById(id);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Query(() => UserConnection)
  async users(@Args('pagination', { nullable: true }) pagination?: PaginationInput) {
    const connection = await this.userService.findAll({ pagination });
    return {
      totalCount: connection.totalCount,
      pageInfo: connection.pageInfo,
      edges: connection.edges.map(edge => ({
        cursor: edge.cursor,
        node: edge.node,
      })),
    }
  }

  @ResolveField()
  async bookings(@Parent() user: UserEntity) {
    return this.bookingService.findByUserId(user.id);
  }

  @ResolveField()
  async maintenanceRequests(
    @Parent() user: UserEntity,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput) {
    return this.dataLoaderService.userMaintenanceRequestsLoader.load(user.id, pagination);
  }

  @ResolveField()
  async organization(@Parent() user: UserEntity) {
    return this.organizationService.findByUserId(user.id);
  }
} 