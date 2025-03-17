import { MaintenanceRequest } from 'maintenance/entities/maintenance-request.entity';
import { OrganizationMember } from 'organization/entities/organization-member.entity';
import { Organization } from 'organization/entities/organization.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, OneToOne } from 'typeorm';

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

  @OneToOne(() => OrganizationMember, organizationMember => organizationMember.user)
  organizationMembership: OrganizationMember;

  @OneToMany(() => MaintenanceRequest, request => request.user)
  maintenanceRequests: MaintenanceRequest[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 