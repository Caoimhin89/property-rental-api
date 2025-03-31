import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn } from 'typeorm';
import { Amenity } from '../../amenity/entities/amenity.entity';
import { Image } from '../../image/entities/image.entity';
import { Review } from '../../review/entities/review.entity';
import { Location } from '../../location/entities/location.entity';
import { ReviewConnection } from '../../graphql';
import { BlockedDate } from './blocked-date.entity';
import { PriceRule } from './price-rule.entity';
import { PropertyType } from '../../graphql';
import { Organization } from '../../organization/entities/organization.entity';
import { MaintenanceRequest } from 'maintenance/entities/maintenance-request.entity';
import { Bed as BedEntity } from './bed.entity';
import { User as UserEntity } from '../../user/entities/user.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('properties')
export class Property {
  __typename?: 'Property';

  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, organization => organization.properties)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('integer', { name: 'max_occupancy' })
  maxOccupancy: number;

  @Column('integer', { name: 'num_bedrooms' })
  numBedrooms: number;

  @Column('float', { name: 'num_bathrooms' })
  numBathrooms: number;

  @Column('integer', { name: 'num_stories' })
  numStories: number;

  @Column('integer', { name: 'garage_spaces' })
  garageSpaces: number;

  @Column('integer', { name: 'year_built' })
  yearBuilt: number;

  @Column('float', { name: 'area_in_square_meters' })
  areaInSquareMeters: number;

  @Column('float', { name: 'lot_size_in_square_meters' })
  lotSizeInSquareMeters: number;
  
  @Column({
    type: 'enum',
    enum: PropertyType,
    name: 'property_type'
  })
  propertyType: PropertyType;

  // for advanced search
  @Column({
    type: 'tsvector',
    select: false,
    nullable: true,
    name: 'search_vector',
    insert: false,
    update: false,
  })
  searchVector?: string;

  // Virtual field for search score
  @Column({
    type: 'float',
    select: false,
    nullable: true,
    name: 'search_similarity',
    insert: false,
    update: false,
  })
  searchSimilarity?: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'base_price', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  basePrice: number;

  @OneToMany(() => MaintenanceRequest, request => request.property)
  maintenanceRequests: MaintenanceRequest[];

  @ManyToMany(() => Amenity, amenity => amenity.properties)
  @JoinTable({
    name: 'property_amenities',
    joinColumn: {
      name: 'property_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'amenity_id',
      referencedColumnName: 'id'
    }
  })
  amenities?: Amenity[];

  @ManyToMany(() => UserEntity, user => user.favoriteProperties)
  @JoinTable({
    name: 'favorite_properties',
    joinColumn: {
      name: 'property_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  favoritedBy: UserEntity[];

  @OneToMany(() => Review, review => review.property)
  reviews?: ReviewConnection;

  @OneToOne(() => Location, location => location.property, { cascade: true })
  location?: Location;

  _resolvedLocation?: Location; // Used to store the resolved location

  @OneToMany(() => Image, image => image.property)
  images?: Image[];

  @OneToMany(() => BlockedDate, blockedDate => blockedDate.property)
  blockedDates?: BlockedDate[];

  @OneToMany(() => PriceRule, priceRule => priceRule.property)
  priceRules?: PriceRule[];

  @OneToMany(() => BedEntity, bed => bed.property, { cascade: true })
  beds?: BedEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 