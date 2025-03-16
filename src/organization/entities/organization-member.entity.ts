import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from '../../user/entities/user.entity';
import { OrganizationRole } from '../../graphql';

@Entity('organization_members')
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, organization => organization.members)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: OrganizationRole,
    name: 'role'
  })
  role: OrganizationRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
} 