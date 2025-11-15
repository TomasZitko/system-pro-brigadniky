import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollCalculation } from './entities/payroll-calculation.entity';
import { Attendance, AttendanceStatus } from '../attendance/entities/attendance.entity';
import { User } from '../users/entities/user.entity';
import { Contract, ContractType } from '../workers/entities/contract.entity';
import { CzechLaborLawService } from './czech-labor-law.service';
import { CsszExportService } from './cssz-export.service';
import { Tenant } from '../tenants/entities/tenant.entity';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollPeriod)
    private periodRepository: Repository<PayrollPeriod>,
    @InjectRepository(PayrollCalculation)
    private calculationRepository: Repository<PayrollCalculation>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private czechLaborLawService: CzechLaborLawService,
    private csszExportService: CsszExportService,
  ) {}

  /**
   * Create a new payroll period
   */
  async createPayrollPeriod(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<PayrollPeriod> {
    const period = this.periodRepository.create({
      tenantId,
      periodStart,
      periodEnd,
    });

    return this.periodRepository.save(period);
  }

  /**
   * Calculate payroll for a period
   * This runs all the Czech Labor Law calculations automatically
   */
  async calculatePayroll(periodId: string): Promise<PayrollCalculation[]> {
    const period = await this.periodRepository.findOne({
      where: { id: periodId },
    });

    if (!period) {
      throw new BadRequestException('Payroll period not found');
    }

    if (period.isLocked) {
      throw new BadRequestException('Payroll period is already locked');
    }

    // Get all approved attendance records for this period
    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        tenantId: period.tenantId,
        status: AttendanceStatus.APPROVED,
        clockInTime: Between(period.periodStart, period.periodEnd),
      },
      relations: ['worker', 'shift'],
    });

    // Group by worker
    const workerAttendance = this.groupAttendanceByWorker(attendanceRecords);

    const calculations: PayrollCalculation[] = [];

    for (const [workerId, attendance] of Object.entries(workerAttendance)) {
      const calculation = await this.calculateWorkerPayroll(
        period.tenantId,
        period.id,
        workerId,
        attendance,
        period.periodStart,
      );

      calculations.push(calculation);
    }

    return calculations;
  }

  /**
   * Calculate payroll for a single worker
   */
  private async calculateWorkerPayroll(
    tenantId: string,
    periodId: string,
    workerId: string,
    attendance: Attendance[],
    periodStart: Date,
  ): Promise<PayrollCalculation> {
    const worker = await this.userRepository.findOne({
      where: { id: workerId },
    });

    // Get active contract
    const contract = await this.contractRepository.findOne({
      where: { workerId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    if (!contract) {
      throw new BadRequestException(`No active contract found for worker ${workerId}`);
    }

    const hourlyRate = contract.hourlyRate;

    let totalRegularHours = 0;
    let totalWeekendHours = 0;
    let totalNightHours = 0;
    let totalHolidayHours = 0;

    let basePay = 0;
    let weekendSupplement = 0;
    let nightSupplement = 0;
    let holidaySupplement = 0;

    // Process each attendance record
    for (const att of attendance) {
      const hours = Number(att.approvedHours);

      // Calculate supplements
      const supplements = await this.czechLaborLawService.calculateSupplements(
        tenantId,
        att,
        hourlyRate,
      );

      // Categorize hours
      const isHoliday = await this.czechLaborLawService.isPublicHoliday(att.clockInTime);
      const isWeekend = this.czechLaborLawService.isWeekendWork(att.clockInTime);
      const nightHours = this.czechLaborLawService.calculateNightHours(
        att.clockInTime,
        att.clockOutTime,
      );

      if (isHoliday) {
        totalHolidayHours += hours;
      } else if (isWeekend) {
        totalWeekendHours += hours;
      } else {
        totalRegularHours += hours;
      }

      totalNightHours += nightHours;

      // Accumulate pay and supplements
      basePay += hours * hourlyRate;
      weekendSupplement += supplements.weekendSupplement;
      nightSupplement += supplements.nightSupplement;
      holidaySupplement += supplements.holidaySupplement;
    }

    // Calculate YTD hours for DPP limit tracking
    const ytdHours = await this.calculateYtdHours(
      workerId,
      tenantId,
      periodStart.getFullYear(),
    );

    // Check DPP hour limit
    if (contract.contractType === ContractType.DPP) {
      const limitCheck = this.czechLaborLawService.checkDppHourLimit(ytdHours);
      if (limitCheck.isNearLimit) {
        console.warn(
          `Worker ${workerId}: ${limitCheck.warningMessage}`,
        );
        // TODO: Send notification to manager
      }
    }

    // Performance bonus (from gamification - placeholder)
    const performanceBonus = 0;

    // Calculate gross pay
    const grossPay =
      basePay +
      weekendSupplement +
      nightSupplement +
      holidaySupplement +
      performanceBonus;

    // Create or update calculation
    let calculation = await this.calculationRepository.findOne({
      where: { payrollPeriodId: periodId, workerId },
    });

    if (!calculation) {
      calculation = this.calculationRepository.create({
        tenantId,
        payrollPeriodId: periodId,
        workerId,
      });
    }

    calculation.totalRegularHours = Number(totalRegularHours.toFixed(2));
    calculation.totalWeekendHours = Number(totalWeekendHours.toFixed(2));
    calculation.totalNightHours = Number(totalNightHours.toFixed(2));
    calculation.totalHolidayHours = Number(totalHolidayHours.toFixed(2));
    calculation.basePay = Number(basePay.toFixed(2));
    calculation.weekendSupplement = Number(weekendSupplement.toFixed(2));
    calculation.nightSupplement = Number(nightSupplement.toFixed(2));
    calculation.holidaySupplement = Number(holidaySupplement.toFixed(2));
    calculation.performanceBonus = Number(performanceBonus.toFixed(2));
    calculation.grossPay = Number(grossPay.toFixed(2));
    calculation.ytdHours = Number(ytdHours.toFixed(2));
    calculation.workerBirthNumber = worker.birthNumber;
    calculation.workerHealthInsuranceCode = worker.healthInsuranceCode;

    return this.calculationRepository.save(calculation);
  }

  /**
   * Lock payroll period (no more changes allowed)
   */
  async lockPayrollPeriod(
    periodId: string,
    managerId: string,
  ): Promise<PayrollPeriod> {
    const period = await this.periodRepository.findOne({
      where: { id: periodId },
    });

    if (!period) {
      throw new BadRequestException('Payroll period not found');
    }

    period.isLocked = true;
    period.lockedByManagerId = managerId;
    period.lockedAt = new Date();

    return this.periodRepository.save(period);
  }

  /**
   * Generate ČSSZ VPDPP XML export (THE KILLER FEATURE)
   */
  async generateCsszExport(periodId: string): Promise<{ xml: string; csv: string }> {
    const period = await this.periodRepository.findOne({
      where: { id: periodId },
    });

    if (!period) {
      throw new BadRequestException('Payroll period not found');
    }

    if (!period.isLocked) {
      throw new BadRequestException('Payroll period must be locked before export');
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: period.tenantId },
    });

    const calculations = await this.calculationRepository.find({
      where: { payrollPeriodId: periodId },
      relations: ['worker'],
    });

    if (calculations.length === 0) {
      throw new BadRequestException('No payroll calculations found for this period');
    }

    const periodMonth = period.periodStart.getMonth() + 1;
    const periodYear = period.periodStart.getFullYear();

    // Generate ČSSZ XML
    const xml = this.csszExportService.generateVpdppXml(
      tenant,
      calculations,
      periodMonth,
      periodYear,
    );

    // Generate CSV for accounting software
    const csv = this.csszExportService.generateAccountingCsv(calculations);

    // Update period with export timestamp
    period.csszExportGeneratedAt = new Date();
    await this.periodRepository.save(period);

    return { xml, csv };
  }

  /**
   * Get payroll periods for tenant
   */
  async getPayrollPeriods(tenantId: string): Promise<PayrollPeriod[]> {
    return this.periodRepository.find({
      where: { tenantId },
      order: { periodStart: 'DESC' },
    });
  }

  /**
   * Get calculations for a period
   */
  async getPayrollCalculations(periodId: string): Promise<PayrollCalculation[]> {
    return this.calculationRepository.find({
      where: { payrollPeriodId: periodId },
      relations: ['worker'],
    });
  }

  /**
   * Get worker's pay estimate for current period
   */
  async getWorkerPayEstimate(
    workerId: string,
    tenantId: string,
  ): Promise<{
    estimatedHours: number;
    estimatedBasePay: number;
    estimatedSupplements: number;
    estimatedGrossPay: number;
  }> {
    // Get current month's approved attendance
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const attendance = await this.attendanceRepository.find({
      where: {
        workerId,
        tenantId,
        status: AttendanceStatus.APPROVED,
        clockInTime: Between(monthStart, monthEnd),
      },
    });

    const contract = await this.contractRepository.findOne({
      where: { workerId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    const hourlyRate = contract?.hourlyRate || 0;

    let estimatedHours = 0;
    let estimatedBasePay = 0;
    let estimatedSupplements = 0;

    for (const att of attendance) {
      const hours = Number(att.approvedHours);
      estimatedHours += hours;
      estimatedBasePay += hours * hourlyRate;

      const supplements = await this.czechLaborLawService.calculateSupplements(
        tenantId,
        att,
        hourlyRate,
      );

      estimatedSupplements += supplements.totalSupplements;
    }

    return {
      estimatedHours: Number(estimatedHours.toFixed(2)),
      estimatedBasePay: Number(estimatedBasePay.toFixed(2)),
      estimatedSupplements: Number(estimatedSupplements.toFixed(2)),
      estimatedGrossPay: Number((estimatedBasePay + estimatedSupplements).toFixed(2)),
    };
  }

  // Helper methods

  private groupAttendanceByWorker(
    attendance: Attendance[],
  ): Record<string, Attendance[]> {
    return attendance.reduce((acc, att) => {
      if (!acc[att.workerId]) {
        acc[att.workerId] = [];
      }
      acc[att.workerId].push(att);
      return acc;
    }, {});
  }

  private async calculateYtdHours(
    workerId: string,
    tenantId: string,
    year: number,
  ): Promise<number> {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const attendance = await this.attendanceRepository.find({
      where: {
        workerId,
        tenantId,
        status: AttendanceStatus.APPROVED,
        clockInTime: Between(yearStart, yearEnd),
      },
    });

    return attendance.reduce(
      (total, att) => total + Number(att.approvedHours || 0),
      0,
    );
  }
}
