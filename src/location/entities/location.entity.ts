import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Property } from '../../property/entities/property.entity';
import { NearbyPlace } from '../../nearby-place/entities/nearby-place.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Property, property => property.location)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column()
  address: string;

  @Column('varchar', { nullable: true, name: 'postal_code' })
  postalCode: string;

  @Column('varchar', { nullable: true, name: 'postal_code_suffix' })
  postalCodeSuffix: string;

  @Column()
  city: string;

  @Column()
  county: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @OneToMany(() => NearbyPlace, place => place.location)
  nearbyPlaces: NearbyPlace[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}