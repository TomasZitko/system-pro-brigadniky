import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '@/modules/tenants/entities/tenant.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Shift } from '@/modules/shifts/entities/shift.entity';

export enum AttendanceStatus {
  SCHEDULED = 'scheduled',
  CLOCKED_IN = 'clocked_in',
  CLOCKED_OUT = 'clocked_out',
  APPROVED = 'approved',
  DISPUTED = 'disputed',
}

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'shift_id' })
  shiftId: string;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ name: 'worker_id' })
  workerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'worker_id' })
  worker: User;

  @Column({ name: 'clock_in_time', type: 'timestamp', nullable: true })
  clockInTime: Date;

  @Column({ name: 'clock_in_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  clockInLatitude: number;

  @Column({ name: 'clock_in_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  clockInLongitude: number;

  @Column({ name: 'clock_out_time', type: 'timestamp', nullable: true })
  clockOutTime: Date;

  @Column({ name: 'clock_out_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  clockOutLatitude: number;

  @Column({ name: 'clock_out_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  clockOutLongitude: number;

  @Column({ name: 'total_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalHours: number;

  @Column({ name: 'approved_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  approvedHours: number;

  @Column({ name: 'approved_by_manager_id', nullable: true })
  approvedByManagerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_manager_id' })
  approvedByManager: User;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.SCHEDULED,
  })
  status: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'manager_notes', type: 'text', nullable: true })
  managerNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
