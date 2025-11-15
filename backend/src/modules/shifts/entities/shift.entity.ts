import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '@/modules/tenants/entities/tenant.entity';
import { User } from '@/modules/users/entities/user.entity';

export enum ShiftStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  ASSIGNED = 'assigned',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'assigned_worker_id', nullable: true })
  assignedWorkerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_worker_id' })
  assignedWorker: User;

  @Column({ name: 'created_by_manager_id' })
  createdByManagerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_manager_id' })
  createdByManager: User;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({ name: 'role_name', nullable: true })
  roleName: string;

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2 })
  hourlyRate: number;

  @Column({
    type: 'enum',
    enum: ShiftStatus,
    default: ShiftStatus.DRAFT,
  })
  status: ShiftStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'is_open_to_marketplace', default: false })
  isOpenToMarketplace: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
