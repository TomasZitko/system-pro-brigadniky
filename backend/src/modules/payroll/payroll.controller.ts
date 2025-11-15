import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Post('periods')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new payroll period' })
  async createPeriod(
    @Body() body: { periodStart: string; periodEnd: string },
    @CurrentUser() user: User,
  ) {
    return this.payrollService.createPayrollPeriod(
      user.tenantId,
      new Date(body.periodStart),
      new Date(body.periodEnd),
    );
  }

  @Get('periods')
  @Roles(UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.FRANCHISE_HQ)
  @ApiOperation({ summary: 'Get all payroll periods' })
  async getPeriods(@CurrentUser() user: User) {
    return this.payrollService.getPayrollPeriods(user.tenantId);
  }

  @Post('periods/:periodId/calculate')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Calculate payroll for a period' })
  async calculatePayroll(@Param('periodId') periodId: string) {
    return this.payrollService.calculatePayroll(periodId);
  }

  @Put('periods/:periodId/lock')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Lock payroll period (finalize)' })
  async lockPeriod(@Param('periodId') periodId: string, @CurrentUser() user: User) {
    return this.payrollService.lockPayrollPeriod(periodId, user.id);
  }

  @Get('periods/:periodId/calculations')
  @Roles(UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.FRANCHISE_HQ)
  @ApiOperation({ summary: 'Get payroll calculations for a period' })
  async getCalculations(@Param('periodId') periodId: string) {
    return this.payrollService.getPayrollCalculations(periodId);
  }

  @Get('periods/:periodId/export/cssz')
  @Roles(UserRole.MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: '🔥 KILLER FEATURE: Generate ČSSZ VPDPP XML export' })
  async exportCssz(@Param('periodId') periodId: string, @Res() res: Response) {
    const { xml, csv } = await this.payrollService.generateCsszExport(periodId);

    // Return XML file for download
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cssz_vpdpp_${periodId}.xml"`,
    );
    res.send(xml);
  }

  @Get('periods/:periodId/export/csv')
  @Roles(UserRole.MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Generate CSV export for accounting software (POHODA, Money S3)' })
  async exportCsv(@Param('periodId') periodId: string, @Res() res: Response) {
    const { csv } = await this.payrollService.generateCsszExport(periodId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payroll_export_${periodId}.csv"`,
    );
    res.send(csv);
  }

  @Get('my-pay-estimate')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Get real-time pay estimate for current month' })
  async getMyPayEstimate(@CurrentUser() user: User) {
    return this.payrollService.getWorkerPayEstimate(user.id, user.tenantId);
  }
}
