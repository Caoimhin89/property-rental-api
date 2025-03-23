import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { Notification as NotificationType, NotificationConnection, PaginationInput, NotificationFilter } from '../graphql';
import { Notification as NotificationEntity } from './entities/notification.entity';

@Resolver(() => NotificationType)
export class NotificationResolver {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @Query(() => NotificationType, { nullable: true })
  async notification(@Args('id') id: string): Promise<NotificationType | null> {
    return await this.notificationService.getById(id);
  }

  @Query(() => NotificationConnection)
  async notifications(
    @Args('userId') userId: string,
    @Args('filter', { nullable: true }) filter?: NotificationFilter,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput) {
    const connection = await this.notificationService.findAll(userId, filter, pagination);
    return {
      totalCount: connection.totalCount,
      pageInfo: connection.pageInfo,
      edges: connection.edges.map(edge => ({
        cursor: edge.cursor,
        node: edge.node,
      })),
    }
  }
} 