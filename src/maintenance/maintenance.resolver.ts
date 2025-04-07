import { Resolver, Query, Mutation, Args, ResolveField, Parent, ID, Subscription } from '@nestjs/graphql';
import { Inject, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceRequest as MaintenanceRequestEntity } from './entities/maintenance-request.entity';
import {
  MaintenanceRequest as MaintenanceRequestType,
  MaintenanceComment as MaintenanceCommentType,
  MaintenanceImage as MaintenanceImageType,
  User as UserType,
  Property as PropertyType,
  PaginationInput,
  CreateMaintenanceCommentInput,
  CreateMaintenanceImageInput,
  CreateMaintenanceRequestInput,
  UpdateMaintenanceRequestInput,
  MaintenanceCommentConnection,
  MaintenanceImageConnection,
  MaintenanceCommentSubscriptionInput
} from '../graphql';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User as UserEntity } from '../user/entities/user.entity';
import { RedisPubSub } from 'graphql-redis-subscriptions/dist/redis-pubsub';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '../event-processor/events/event-processor.events';
import { SUBSCRIPTION_EVENTS } from '../redis-pubsub/events/redis-pub-sub.events';
import { userHasAccessToResource } from 'common/utils';

@Resolver(() => MaintenanceRequestType)
export class MaintenanceResolver {
  constructor(
    private maintenanceService: MaintenanceService,
    @Inject('PUB_SUB') private pubSub: RedisPubSub,
    private eventEmitter: EventEmitter2
  ) { }

  @Query(() => MaintenanceRequestType, { nullable: true })
  async maintenanceRequest(
    @Args('id', { type: () => ID }) id: string
  ) {
    return this.maintenanceService.findById(id);
  }

  @Query(() => MaintenanceRequestType)
  async maintenanceRequests(
    @Args('propertyId', { type: () => ID, nullable: true }) propertyId?: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ) {
    return this.maintenanceService.findAll({ propertyId, status, pagination });
  }

  @Mutation(() => MaintenanceRequestType)
  @UseGuards(JwtAuthGuard)
  async createMaintenanceRequest(
    @Args('input') input: CreateMaintenanceRequestInput,
    @CurrentUser() user: UserEntity
  ) {
    return this.maintenanceService.create(user.id, input);
  }

  @Mutation(() => MaintenanceRequestType)
  @UseGuards(JwtAuthGuard)
  async updateMaintenanceRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateMaintenanceRequestInput
  ) {
    return this.maintenanceService.update(id, input);
  }

  @Mutation(() => MaintenanceCommentType)
  @UseGuards(JwtAuthGuard)
  async addMaintenanceComment(
    @Args('input') input: CreateMaintenanceCommentInput,
    @CurrentUser() user: UserEntity
  ) {
    const comment = await this.maintenanceService.addComment(user, input);
    this.eventEmitter.emit(EVENTS.MAINTENANCE_COMMENT_CREATE, {
      comment,
      requestId: input.maintenanceRequestId,
      userId: user.id,
    });
    return comment;
  }

  @Mutation(() => MaintenanceImageType)
  @UseGuards(JwtAuthGuard)
  async addMaintenanceImage(
    @Args('input') input: CreateMaintenanceImageInput
  ) {
    return this.maintenanceService.addImage(input);
  }

  @ResolveField(() => PropertyType)
  async property(@Parent() request: MaintenanceRequestEntity) {
    return this.maintenanceService.getProperty(request.propertyId);
  }

  @ResolveField(() => UserType)
  async user(@Parent() request: MaintenanceRequestEntity) {
    return this.maintenanceService.getUser(request.userId);
  }

  @ResolveField(() => MaintenanceCommentConnection)
  async comments(
    @Parent() request: MaintenanceRequestEntity,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ) {
    return this.maintenanceService.getComments(request.id, pagination);
  }

  @ResolveField(() => MaintenanceImageConnection)
  async photos(
    @Parent() request: MaintenanceRequestEntity,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ) {
    return this.maintenanceService.getImages(request.id, pagination);
  }

  @Subscription(() => MaintenanceCommentType, {
    filter: async (
      payload: {
        maintenanceCommentAdded: MaintenanceCommentType;
        requestId: string;
        userId: string;
        organizationId: string;
        propertyId: string;
      },
      variables: {
        input: {
          level: 'REQUEST' | 'PROPERTY' | 'ORGANIZATION' | 'USER';
          requestId?: string;
          propertyId?: string;
          organizationId?: string;
        }
      },
      context: { req: { user: UserEntity } }
    ) => {
      if (!context.req.user) return false;

      const hasAccess = await userHasAccessToResource(
        context.req.user,
        {
          organizationId: payload.organizationId,
          userId: payload.userId
        }
      );
      if (!hasAccess) return false;

      switch (variables.input.level) {
        case 'REQUEST':
          return payload.requestId === variables.input.requestId;
        case 'PROPERTY':
          return payload.propertyId === variables.input.propertyId;
        case 'ORGANIZATION':
          return payload.organizationId === variables.input.organizationId;
        case 'USER':
          return payload.userId === context.req.user.id;
        default:
          return false;
      }
    }
  })
  maintenanceCommentAdded(
    @Args('input') input: MaintenanceCommentSubscriptionInput,
    @CurrentUser() user: UserEntity
  ) {
    switch (input.level) {
      case 'REQUEST':
        return this.pubSub.asyncIterator(`maintenanceComment:request:${input.requestId}`);
      case 'PROPERTY':
        return this.pubSub.asyncIterator(`maintenanceComment:property:${input.propertyId}`);
      case 'ORGANIZATION':
        return this.pubSub.asyncIterator(`maintenanceComment:organization:${input.organizationId}`);
      case 'USER':
        return this.pubSub.asyncIterator(`maintenanceComment:user:${user.id}`);
      default:
        throw new Error('Invalid subscription level');
    }
  }
}
