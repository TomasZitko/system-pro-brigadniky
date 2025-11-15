import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '@/modules/tenants/entities/tenant.entity';
import { User } from '@/modules/users/entities/user.entity';
import { PayrollPeriod } from './payroll-period.entity';

@Entity('payroll_calculations')
export class PayrollCalculation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'payroll_period_id' })
  payrollPeriodId: string;

  @ManyToOne(() => PayrollPeriod)
  @JoinColumn({ name: 'payroll_period_id' })
  payrollPeriod: PayrollPeriod;

  @Column({ name: 'worker_id' })
  workerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'worker_id' })
  worker: User;

  @Column({ name: 'total_regular_hours', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRegularHours: number;

  @Column({ name: 'total_weekend_hours', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalWeekendHours: number;

  @Column({ name: 'total_night_hours', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalNightHours: number;

  @Column({ name: 'total_holiday_hours', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalHolidayHours: number;

  @Column({ name: 'base_pay', type: 'decimal', precision: 10, scale: 2, default: 0 })
  basePay: number;

  @Column({ name: 'weekend_supplement', type: 'decimal', precision: 10, scale: 2, default: 0 })
  weekendSupplement: number;

  @Column({ name: 'night_supplement', type: 'decimal', precision: 10, scale: 2, default: 0 })
  nightSupplement: number;

  @Column({ name: 'holiday_supplement', type: 'decimal', precision: 10, scale: 2, default: 0 })
  holidaySupplement: number;

  @Column({ name: 'performance_bonus', type: 'decimal', precision: 10, scale: 2, default: 0 })
  performanceBonus: number;

  @Column({ name: 'gross_pay', type: 'decimal', precision: 10, scale: 2 })
  grossPay: number;

  @Column({ name: 'ytd_hours', type: 'decimal', precision: 10, scale: 2, default: 0 })
  ytdHours: number;

  @Column({ name: 'worker_birth_number', nullable: true })
  workerBirthNumber: string;

  @Column({ name: 'worker_health_insurance_code', nullable: true })
  workerHealthInsuranceCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
