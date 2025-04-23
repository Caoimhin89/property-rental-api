import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn } from 'typeorm';
import { OrganizationMember } from './organization-member.entity';
import { Property } from '../../property/entities/property.entity';
import { OrganizationType } from '../../graphql';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: OrganizationType,
    name: 'organization_type'
  })
  organizationType: OrganizationType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  foundedDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string;
  

  @OneToMany(() => OrganizationMember, (member: OrganizationMember) => member.organization)
  members: OrganizationMember[];

  @OneToMany(() => Property, (property: Property) => property.organization)
  properties: Property[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
