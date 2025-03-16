import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Property } from '../../property/entities/property.entity';
import { User } from '../../user/entities/user.entity';
import { MaintenanceComment } from './maintenance-comment.entity';
import { MaintenanceImage } from './maintenance-image.entity';

export enum MaintenanceRequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum MaintenanceRequestUrgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

@Entity('maintenance_requests')
export class MaintenanceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  description: string;

  @Column({
    type: 'enum',
    enum: MaintenanceRequestStatus,
    default: MaintenanceRequestStatus.PENDING
  })
  status: MaintenanceRequestStatus;

  @Column({
    type: 'enum',
    enum: MaintenanceRequestUrgency,
    default: MaintenanceRequestUrgency.MEDIUM
  })
  urgency: MaintenanceRequestUrgency;

  @ManyToOne(() => Property, property => property.maintenanceRequests)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column('uuid', { name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  
  @ManyToOne(() => User)
  user: User;

  @Column('uuid', { name: 'user_id' })
  @JoinColumn({ name: 'user_id' })
  userId: string;

  @OneToMany(() => MaintenanceComment, comment => comment.maintenanceRequest)
  comments: MaintenanceComment[];

  @OneToMany(() => MaintenanceImage, image => image.maintenanceRequest)
  photos: MaintenanceImage[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone'
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone'
  })
  updatedAt: Date;
}