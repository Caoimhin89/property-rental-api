import { Resolver, Query, Mutation, Args, ResolveField, Parent, ID, Subscription, Context } from '@nestjs/graphql';
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
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '../event-processor/events/event-processor.events';
import { SUBSCRIPTION_EVENTS } from '../pubsub/events/pub-sub.events';
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
    name: 'maintenanceCommentAdded',
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
      console.log('Starting subscription filter with:', {
        level: variables.input.level,
        input: variables.input,
        payload
      });

      if (!context.req.user) {
        console.log('Filter failed: No user in context');
        return false;
      }

      const hasAccess = await userHasAccessToResource(
        context.req.user,
        {
          organizationId: payload.organizationId,
          userId: payload.userId
        }
      );
      
      console.log('Access check result:', hasAccess);
      
      if (!hasAccess) {
        console.log('Filter failed: No access');
        return false;
      }

      let matches = false;
      const level = variables.input.level;
      console.log('Checking level:', level);

      if (level === 'REQUEST') {
        matches = payload.requestId === variables.input.requestId;
        console.log('REQUEST level check:', {
          payloadId: payload.requestId,
          inputId: variables.input.requestId,
          matches
        });
      }
      else if (level === 'PROPERTY') {
        matches = payload.propertyId === variables.input.propertyId;
        console.log('PROPERTY level check:', {
          payloadId: payload.propertyId,
          inputId: variables.input.propertyId,
          matches
        });
      }
      else if (level === 'ORGANIZATION') {
        matches = payload.organizationId === variables.input.organizationId;
        console.log('ORGANIZATION level check:', {
          payloadId: payload.organizationId,
          inputId: variables.input.organizationId,
          matches
        });
      }
      else if (level === 'USER') {
        matches = payload.userId === context.req.user.id;
        console.log('USER level check:', {
          payloadId: payload.userId,
          userId: context.req.user.id,
          matches
        });
      }

      console.log('Final filter result:', matches);
      return matches;
    }
  })
  maintenanceCommentAdded(
    @Args('input') input: MaintenanceCommentSubscriptionInput,
    @Context() context: { req: { user: UserEntity } }
  ) {
    console.log('Setting up subscription with:', {
      level: input.level,
      input,
      user: context?.req?.user
    });

    const channel = (() => {
      switch (input.level) {
        case 'REQUEST':
          return `maintenanceComment:request:${input.requestId}`;
        case 'PROPERTY':
          return `maintenanceComment:property:${input.propertyId}`;
        case 'ORGANIZATION':
          return `maintenanceComment:organization:${input.organizationId}`;
        case 'USER':
          return context?.req?.user ? 
            `maintenanceComment:user:${context.req.user.id}` : 
            null;
        default:
          throw new Error('Invalid subscription level');
      }
    })();

    if (!channel) {
      throw new Error('Could not determine subscription channel');
    }

    console.log('Subscribing to channel:', channel);
    return this.pubSub.asyncIterator(channel);
  }
}
