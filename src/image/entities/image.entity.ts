import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Property } from '../../property/entities/property.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'property_id' })
  propertyId: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  caption?: string;

  @ManyToOne(() => Property, property => property.images)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 