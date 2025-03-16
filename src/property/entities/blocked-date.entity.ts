import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Property } from './property.entity';

@Entity('blocked_dates')
export class BlockedDate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property, property => property.blockedDates)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column('date', { name: 'start_date' })
  startDate: Date;

  @Column('date', { name: 'end_date' })
  endDate: Date;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
