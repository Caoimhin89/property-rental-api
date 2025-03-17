import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne } from 'typeorm';
import { Location as LocationEntity } from '../../location/entities/location.entity';
@Entity('nearby_places')
export class NearbyPlace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => LocationEntity, location => location.nearbyPlace, { cascade: true })
  location: LocationEntity;

  @Column('uuid', { name: 'location_id' })
  locationId: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column('decimal', { precision: 10, scale: 2 })
  distance: number;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 