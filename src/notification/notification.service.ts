import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './entities/notification.entity';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationFilter, PaginationInput } from '../graphql';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to response topics
    this.kafkaClient.subscribeToResponseOf('notifications.created');
    this.kafkaClient.subscribeToResponseOf('notifications.updated');
    await this.kafkaClient.connect();
  }

  async publish(topic: string, message: any) {
    return this.kafkaClient.emit(topic, {
      key: message.userId,
      value: message,
      headers: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  async create(data: {
    userId: string;
    title: string;
    description: string;
    type: NotificationType;
    link: string;
    linkText: string;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    const savedNotification = await this.notificationRepository.save(notification);

    // Publish to Kafka for real-time updates
    await this.publish('notifications.created', {
      userId: data.userId,
      notification: savedNotification,
    });

    return savedNotification;
  }

  async findAll(
    userId: string,
    filter?: NotificationFilter,
    pagination?: PaginationInput) {
    const query = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (filter?.read !== undefined) {
      query.andWhere('notification.isRead = :isRead', { isRead: filter.read });
    }

    if (pagination?.after) {
      const decodedCursor = Buffer.from(pagination.after, 'base64').toString();
      const [timestamp, id] = decodedCursor.split(':');
      query.andWhere(
        '(notification.createdAt, notification.id) < (:timestamp, :id)',
        { timestamp: new Date(timestamp), id }
      );
    }

    const limit = pagination?.first || 10;
    query.take(limit + 1);

    const [notifications, totalCount] = await query.getManyAndCount();
    const hasNextPage = notifications.length > limit;
    if (hasNextPage) {
      notifications.pop();
    }

    const edges = notifications.map(notification => ({
      cursor: Buffer.from(
        `${notification.createdAt.toISOString()}:${notification.id}`
      ).toString('base64'),
      node: notification,
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: edges[edges.length - 1]?.cursor,
      },
      totalCount,
    };
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOneOrFail({
      where: { id }
    });
    
    notification.isRead = true;
    const updatedNotification = await this.notificationRepository.save(notification);

    await this.publish('notifications.updated', {
      userId: notification.userId,
      notification: updatedNotification,
    });

    return updatedNotification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );

    await this.publish('notifications.bulk_updated', {
      userId,
      action: 'MARK_ALL_READ',
    });
  }

  async getById(id: string): Promise<Notification | null> {
    return this.notificationRepository.findOne({
      where: { id }
    });
  }

  // Helper methods for creating specific notification types
  async createBookingNotification(
    userId: string,
    bookingId: string,
    type: NotificationType,
  ): Promise<Notification> {
    const templates = {
      [NotificationType.BOOKING_CONFIRMED]: {
        title: 'Booking Confirmed',
        description: 'Your booking has been confirmed',
        linkText: 'View Booking',
      },
      [NotificationType.BOOKING_REJECTED]: {
        title: 'Booking Rejected',
        description: 'Your booking request has been rejected',
        linkText: 'View Booking',
      },
      [NotificationType.BOOKING_CANCELLED]: {
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled',
        linkText: 'View Booking',
      },
      [NotificationType.BOOKING_PAYMENT]: {
        title: 'Booking Payment',
        description: 'Your booking payment has been received',
        linkText: 'View Booking',
      },
      [NotificationType.BOOKING_CHECKIN]: {
        title: 'Booking Check-In',
        description: 'You have checked in to your booking',
        linkText: 'View Booking',
      },
      [NotificationType.BOOKING_CHECKOUT]: {
        title: 'Booking Check-Out',
        description: 'Your booking has been checked out',
        linkText: 'View Booking',
      },
    };

    const template = templates[type];
    return this.create({
      userId,
      type,
      title: template.title,
      description: template.description,
      link: `/bookings/${bookingId}`,
      linkText: template.linkText,
    });
  }
}
