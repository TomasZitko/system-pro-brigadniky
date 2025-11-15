import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Shift, ShiftStatus } from './entities/shift.entity';
import { ShiftApplication } from './entities/shift-application.entity';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
    @InjectRepository(ShiftApplication)
    private applicationRepository: Repository<ShiftApplication>,
  ) {}

  async createShift(shiftData: Partial<Shift>): Promise<Shift> {
    const shift = this.shiftRepository.create(shiftData);
    return this.shiftRepository.save(shift);
  }

  async getShiftsByTenant(tenantId: string, startDate?: Date, endDate?: Date): Promise<Shift[]> {
    const where: any = { tenantId };

    if (startDate && endDate) {
      where.startTime = Between(startDate, endDate);
    }

    return this.shiftRepository.find({
      where,
      relations: ['assignedWorker', 'createdByManager'],
      order: { startTime: 'ASC' },
    });
  }

  async getMarketplaceShifts(tenantId: string): Promise<Shift[]> {
    return this.shiftRepository.find({
      where: {
        tenantId,
        isOpenToMarketplace: true,
        status: ShiftStatus.OPEN,
      },
      relations: ['createdByManager'],
      order: { startTime: 'ASC' },
    });
  }

  async getWorkerShifts(workerId: string): Promise<Shift[]> {
    return this.shiftRepository.find({
      where: { assignedWorkerId: workerId },
      order: { startTime: 'ASC' },
    });
  }

  async applyToShift(shiftId: string, workerId: string, tenantId: string, message?: string): Promise<ShiftApplication> {
    const application = this.applicationRepository.create({
      shiftId,
      workerId,
      tenantId,
      message,
    });

    return this.applicationRepository.save(application);
  }

  async approveApplication(applicationId: string): Promise<Shift> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['shift'],
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Update shift
    await this.shiftRepository.update(application.shiftId, {
      assignedWorkerId: application.workerId,
      status: ShiftStatus.ASSIGNED,
      isOpenToMarketplace: false,
    });

    // Update application
    application.status = 'approved';
    await this.applicationRepository.save(application);

    return this.shiftRepository.findOne({
      where: { id: application.shiftId },
    });
  }

  async updateShift(shiftId: string, updateData: Partial<Shift>): Promise<Shift> {
    await this.shiftRepository.update(shiftId, updateData);
    return this.shiftRepository.findOne({ where: { id: shiftId } });
  }
}
