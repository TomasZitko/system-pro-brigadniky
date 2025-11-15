import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '@/modules/tenants/entities/tenant.entity';

export enum SupplementType {
  WEEKEND = 'weekend',
  NIGHT = 'night',
  HOLIDAY = 'holiday',
  OVERTIME = 'overtime',
}

@Entity('supplement_rules')
export class SupplementRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({
    name: 'supplement_type',
    type: 'enum',
    enum: SupplementType,
  })
  supplementType: SupplementType;

  @Column({ name: 'percentage_increase', type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentageIncrease: number;

  @Column({ name: 'fixed_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  fixedAmount: number;

  @Column({ name: 'applies_from_time', type: 'time', nullable: true })
  appliesFromTime: string;

  @Column({ name: 'applies_to_time', type: 'time', nullable: true })
  appliesToTime: string;

  @Column({ name: 'applies_on_day', nullable: true })
  appliesOnDay: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
