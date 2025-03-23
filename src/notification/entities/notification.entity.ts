import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn } from 'typeorm';

export enum NotificationType {
  BOOKING_REQUESTED = 'BOOKING_REQUESTED',
  BOOKING_APPROVED = 'BOOKING_APPROVED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_PAYMENT = 'BOOKING_PAYMENT',
  BOOKING_CHECKIN = 'BOOKING_CHECKIN',
  BOOKING_CHECKOUT = 'BOOKING_CHECKOUT',
  MAINTENANCE_REQUEST_CREATED = 'MAINTENANCE_REQUEST_CREATED',
  MAINTENANCE_REQUEST_UPDATED = 'MAINTENANCE_REQUEST_UPDATED',
  MAINTENANCE_REQUEST_COMPLETED = 'MAINTENANCE_REQUEST_COMPLETED',
  MAINTENANCE_REQUEST_CANCELLED = 'MAINTENANCE_REQUEST_CANCELLED',
  REVIEW_REQUESTED = 'REVIEW_REQUESTED',
  REVIEW_REMINDER = 'REVIEW_REMINDER',
  REVIEW_FOLLOWUP = 'REVIEW_FOLLOWUP',
  REVIEW_PUBLISHED = 'REVIEW_PUBLISHED',
  PROPERTY_CREATED = 'PROPERTY_CREATED',
  PROPERTY_APPROVAL_REQUIRED = 'PROPERTY_APPROVAL_REQUIRED',
  PROPERTY_APPROVAL_REQUIRED_REMINDER = 'PROPERTY_APPROVAL_REQUIRED_REMINDER',
  PROPERTY_APPROVED = 'PROPERTY_APPROVED',
  PROPERTY_REJECTED = 'PROPERTY_REJECTED',
  ORGANIZATION_INVITATION = 'ORGANIZATION_INVITATION',
  ORGANIZATION_INVITATION_REMINDER = 'ORGANIZATION_INVITATION_REMINDER',
  ORGANIZATION_MEMBER_ADDED = 'ORGANIZATION_MEMBER_ADDED',
  ORGANIZATION_MEMBER_REMOVED = 'ORGANIZATION_MEMBER_REMOVED',
  OTHER = 'OTHER',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('varchar')
  title: string;

  @Column('varchar')
  description: string;

  @Column('varchar')
  type: NotificationType;

  @Column('varchar')
  link: string;

  @Column('varchar', { name: 'link_text' })
  linkText: string;

  @Column('boolean', { name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 