import { Injectable, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { PropertyService } from '../property/property.service';
import { MaintenanceComment } from '../maintenance/entities/maintenance-comment.entity';
import { Logger } from '@nestjs/common';
import { SUBSCRIPTION_EVENTS } from '../redis-pubsub/events/redis-pub-sub.events';
import { EVENTS as INTERNAL_EVENTS } from './events/event-processor.events';

@Injectable()
export class EventProcessorService implements OnModuleInit {
  private readonly logger = new Logger(EventProcessorService.name);

  constructor(
    @Inject('PUB_SUB') private pubSub: RedisPubSub,
    private maintenanceService: MaintenanceService,
    private propertyService: PropertyService,
  ) {}

  async onModuleInit() {
    this.logger.log('EventProcessorService initialized');
  }

  @OnEvent(INTERNAL_EVENTS.MAINTENANCE_COMMENT_CREATE)
  async handleMaintenanceCommentCreated(payload: {
    comment: MaintenanceComment;
    requestId: string;
    userId: string;
  }) {
    const { comment, requestId, userId } = payload;
    
    try {
      const request = await this.maintenanceService.findById(requestId);
      const property = await this.propertyService.findById(request.propertyId);

      if (!property) {
        this.logger.error('Property not found', { requestId, userId });
        return;
      }
      
      const eventPayload = {
        maintenanceCommentAdded: comment,
        requestId,
        propertyId: property.id,
        userId,
        organizationId: property.organizationId
      };

      // Publish to all relevant channels
      await Promise.all([
        // General channel
        this.pubSub.publish(SUBSCRIPTION_EVENTS.MAINTENANCE_COMMENT_ADDED, eventPayload),
        // Request-specific channel
        this.pubSub.publish(`maintenanceComment:request:${requestId}`, eventPayload),
        // Property-specific channel
        this.pubSub.publish(`maintenanceComment:property:${property.id}`, eventPayload),
        // Organization-specific channel
        this.pubSub.publish(`maintenanceComment:organization:${property.organizationId}`, eventPayload)
      ]);
    } catch (error) {
      this.logger.error(
        'Failed to process maintenance comment event',
        error.stack,
        { requestId, userId }
      );
    }
  }
}
