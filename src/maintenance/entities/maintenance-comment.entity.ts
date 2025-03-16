import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn } from 'typeorm';
import { MaintenanceRequest } from './maintenance-request.entity';
import { User } from '../../user/entities/user.entity';

@Entity('maintenance_request_comments')
export class MaintenanceComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  comment: string;

  @Column({ name: 'maintenance_request_id' })
  maintenanceRequestId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => MaintenanceRequest, (request) => request.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'maintenance_request_id' })
  maintenanceRequest: MaintenanceRequest;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
  })
  updatedAt: Date;
}
