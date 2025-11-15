import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicHoliday } from './entities/public-holiday.entity';
import { SupplementRule, SupplementType } from './entities/supplement-rule.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

@Injectable()
export class CzechLaborLawService {
  constructor(
    @InjectRepository(PublicHoliday)
    private holidayRepository: Repository<PublicHoliday>,
    @InjectRepository(SupplementRule)
    private supplementRuleRepository: Repository<SupplementRule>,
  ) {}

  /**
   * Check if a date is a Czech public holiday
   */
  async isPublicHoliday(date: Date): Promise<boolean> {
    const dateString = date.toISOString().split('T')[0];
    const holiday = await this.holidayRepository.findOne({
      where: { date: new Date(dateString) },
    });
    return !!holiday;
  }

  /**
   * Determine if work time is during night hours (22:00 - 06:00)
   */
  isNightWork(time: Date): boolean {
    const hour = time.getHours();
    return hour >= 22 || hour < 6;
  }

  /**
   * Determine if work is on weekend (Saturday or Sunday)
   */
  isWeekendWork(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

  /**
   * Calculate night hours from an attendance record
   */
  calculateNightHours(clockIn: Date, clockOut: Date): number {
    let nightHours = 0;
    const currentTime = new Date(clockIn);

    while (currentTime < clockOut) {
      if (this.isNightWork(currentTime)) {
        nightHours += 1 / 60; // Increment by minute
      }
      currentTime.setMinutes(currentTime.getMinutes() + 1);
    }

    return Number(nightHours.toFixed(2));
  }

  /**
   * Calculate supplements (příplatky) for DPP/DPČ workers according to Czech Labor Code
   *
   * Czech Labor Law supplements for DPP/DPČ:
   * - Weekend work: Min 10% supplement
   * - Night work (22:00-06:00): Min 10% supplement
   * - Public holiday: Min 100% supplement (double pay)
   */
  async calculateSupplements(
    tenantId: string,
    attendance: Attendance,
    hourlyRate: number,
  ): Promise<{
    weekendSupplement: number;
    nightSupplement: number;
    holidaySupplement: number;
    totalSupplements: number;
  }> {
    const { clockInTime, clockOutTime, approvedHours } = attendance;

    if (!clockInTime || !clockOutTime || !approvedHours) {
      return {
        weekendSupplement: 0,
        nightSupplement: 0,
        holidaySupplement: 0,
        totalSupplements: 0,
      };
    }

    let weekendSupplement = 0;
    let nightSupplement = 0;
    let holidaySupplement = 0;

    // Get tenant-specific supplement rules (or use defaults)
    const rules = await this.supplementRuleRepository.find({
      where: { tenantId, isActive: true },
    });

    // Check if public holiday
    const isHoliday = await this.isPublicHoliday(clockInTime);

    if (isHoliday) {
      // Public holiday = 100% supplement (minimum by law)
      const holidayRule = rules.find(r => r.supplementType === SupplementType.HOLIDAY);
      const percentage = holidayRule?.percentageIncrease || 100;
      holidaySupplement = (approvedHours * hourlyRate * percentage) / 100;
    }

    // Check if weekend work
    if (this.isWeekendWork(clockInTime)) {
      const weekendRule = rules.find(r => r.supplementType === SupplementType.WEEKEND);
      const percentage = weekendRule?.percentageIncrease || 10;
      weekendSupplement = (approvedHours * hourlyRate * percentage) / 100;
    }

    // Calculate night work hours and supplement
    const nightHours = this.calculateNightHours(clockInTime, clockOutTime);
    if (nightHours > 0) {
      const nightRule = rules.find(r => r.supplementType === SupplementType.NIGHT);
      const percentage = nightRule?.percentageIncrease || 10;
      nightSupplement = (nightHours * hourlyRate * percentage) / 100;
    }

    const totalSupplements = weekendSupplement + nightSupplement + holidaySupplement;

    return {
      weekendSupplement: Number(weekendSupplement.toFixed(2)),
      nightSupplement: Number(nightSupplement.toFixed(2)),
      holidaySupplement: Number(holidaySupplement.toFixed(2)),
      totalSupplements: Number(totalSupplements.toFixed(2)),
    };
  }

  /**
   * Check if worker is approaching DPP 300-hour yearly limit
   */
  checkDppHourLimit(ytdHours: number): {
    isNearLimit: boolean;
    remainingHours: number;
    warningMessage: string;
  } {
    const DPP_YEARLY_LIMIT = 300;
    const remainingHours = DPP_YEARLY_LIMIT - ytdHours;

    return {
      isNearLimit: remainingHours <= 50,
      remainingHours,
      warningMessage:
        remainingHours <= 0
          ? 'DPP limit exceeded! Must convert to DPČ or employment contract.'
          : remainingHours <= 50
          ? `Warning: Only ${remainingHours} hours remaining before DPP limit.`
          : '',
    };
  }

  /**
   * Validate DPČ monthly income limit (currently no limit for DPČ in Czech law)
   * But we track it for reporting purposes
   */
  validateDpcIncome(monthlyGross: number): {
    isValid: boolean;
    message: string;
  } {
    // DPČ has no monthly or yearly hour limit
    // Just informational
    return {
      isValid: true,
      message: `DPČ income: ${monthlyGross} Kč`,
    };
  }
}
