import { MaintenanceRequest } from 'maintenance/entities/maintenance-request.entity';
import { OrganizationMember } from 'organization/entities/organization-member.entity';
import { Property as PropertyEntity } from 'property/entities/property.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ name: 'verification_token', nullable: true })
  verificationToken?: string;

  @Column({ name: 'verification_token_expires_at', nullable: true })
  verificationTokenExpiresAt?: Date;

  @ManyToMany(() => PropertyEntity, property => property.favoritedBy)
  favoriteProperties: PropertyEntity[];

  @OneToOne(() => OrganizationMember, organizationMember => organizationMember.user)
  organizationMembership: OrganizationMember;

  @OneToMany(() => MaintenanceRequest, request => request.user)
  maintenanceRequests: MaintenanceRequest[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 