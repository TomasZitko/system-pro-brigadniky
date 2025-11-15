import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '@/modules/tenants/entities/tenant.entity';

export enum AchievementTriggerType {
  SHIFT_COUNT = 'shift_count',
  PERFECT_ATTENDANCE = 'perfect_attendance',
  CUSTOMER_RATING = 'customer_rating',
  SALES_MILESTONE = 'sales_milestone',
  CUSTOM = 'custom',
}

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'icon_url', type: 'text', nullable: true })
  iconUrl: string;

  @Column({
    name: 'trigger_type',
    type: 'enum',
    enum: AchievementTriggerType,
  })
  triggerType: AchievementTriggerType;

  @Column({ name: 'trigger_condition', type: 'jsonb' })
  triggerCondition: Record<string, any>;

  @Column({ default: 0 })
  points: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
