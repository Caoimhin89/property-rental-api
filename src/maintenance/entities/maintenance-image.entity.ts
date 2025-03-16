import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MaintenanceRequest } from './maintenance-request.entity';

@Entity('maintenance_images')
export class MaintenanceImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ name: 'maintenance_request_id' })
  maintenanceRequestId: string;

  @ManyToOne(() => MaintenanceRequest, request => request.photos, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'maintenance_request_id' })
  maintenanceRequest: MaintenanceRequest;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone'
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone'
  })
  updatedAt: Date;
}
