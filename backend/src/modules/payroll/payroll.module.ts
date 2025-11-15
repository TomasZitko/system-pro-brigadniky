import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { CsszExportService } from './cssz-export.service';
import { CzechLaborLawService } from './czech-labor-law.service';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollCalculation } from './entities/payroll-calculation.entity';
import { SupplementRule } from './entities/supplement-rule.entity';
import { PublicHoliday } from './entities/public-holiday.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { User } from '../users/entities/user.entity';
import { Contract } from '../workers/entities/contract.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollPeriod,
      PayrollCalculation,
      SupplementRule,
      PublicHoliday,
      Attendance,
      User,
      Contract,
    ]),
  ],
  controllers: [PayrollController],
  providers: [PayrollService, CsszExportService, CzechLaborLawService],
  exports: [PayrollService],
})
export class PayrollModule {}
