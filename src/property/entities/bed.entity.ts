import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Property as PropertyEntity } from './property.entity';

@Entity('beds')
export class Bed {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'property_id' })
    propertyId: string;

    @Column({ name: 'bed_type' })
    bedType: string;

    @Column({ name: 'bed_size' })
    bedSize: string;

    @Column({ name: 'room' })
    room: string;

    @ManyToOne(() => PropertyEntity, property => property.beds)
    @JoinColumn({ name: 'property_id' })
    property: PropertyEntity;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

}