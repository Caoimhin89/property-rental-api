import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Property } from '../../property/entities/property.entity';

@Entity('nearby_places')
export class NearbyPlace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Property, property => property.location)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column()
  location_id: string;

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