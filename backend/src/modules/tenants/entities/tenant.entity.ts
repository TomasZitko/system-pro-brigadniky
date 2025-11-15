import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TenantType } from '@/common/enums';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TenantType,
    default: TenantType.SINGLE_LOCATION,
  })
  type: TenantType;

  @Column({ name: 'parent_tenant_id', nullable: true })
  parentTenantId: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'parent_tenant_id' })
  parentTenant: Tenant;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ nullable: true })
  ico: string;

  @Column({ nullable: true })
  dic: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ name: 'geofence_radius_meters', default: 100 })
  geofenceRadiusMeters: number;

  @Column({ name: 'subscription_tier', default: 'basic' })
  subscriptionTier: string;

  @Column({ name: 'max_workers', default: 50 })
  maxWorkers: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
