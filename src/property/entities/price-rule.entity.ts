import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Property } from './property.entity';

@Entity('price_rules')
export class PriceRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property, property => property.priceRules)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column('date', { name: 'start_date' })
  startDate: Date;

  @Column('date', { name: 'end_date' })
  endDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
