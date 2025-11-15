import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { getDistance } from 'geolib';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async clockIn(
    shiftId: string,
    workerId: string,
    latitude: number,
    longitude: number,
  ): Promise<Attendance> {
    // Get shift and tenant for geofencing
    const shift = await this.shiftRepository.findOne({
      where: { id: shiftId },
      relations: ['tenant'],
    });

    if (!shift) {
      throw new BadRequestException('Shift not found');
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: shift.tenantId },
    });

    // Verify geofence
    if (tenant.latitude && tenant.longitude) {
      const distance = getDistance(
        { latitude, longitude },
        { latitude: tenant.latitude, longitude: tenant.longitude },
      );

      if (distance > tenant.geofenceRadiusMeters) {
        throw new BadRequestException(
          `You must be within ${tenant.geofenceRadiusMeters}m of the location to clock in. Current distance: ${distance}m`,
        );
      }
    }

    // Check if already clocked in
    const existing = await this.attendanceRepository.findOne({
      where: { shiftId, workerId },
    });

    if (existing && existing.clockInTime) {
      throw new BadRequestException('Already clocked in for this shift');
    }

    const attendance = this.attendanceRepository.create({
      shiftId,
      workerId,
      tenantId: shift.tenantId,
      clockInTime: new Date(),
      clockInLatitude: latitude,
      clockInLongitude: longitude,
      status: AttendanceStatus.CLOCKED_IN,
    });

    return this.attendanceRepository.save(attendance);
  }

  async clockOut(
    attendanceId: string,
    latitude: number,
    longitude: number,
  ): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id: attendanceId },
      relations: ['shift', 'shift.tenant'],
    });

    if (!attendance) {
      throw new BadRequestException('Attendance record not found');
    }

    if (attendance.clockOutTime) {
      throw new BadRequestException('Already clocked out');
    }

    // Verify geofence
    const tenant = attendance.shift.tenant;
    if (tenant.latitude && tenant.longitude) {
      const distance = getDistance(
        { latitude, longitude },
        { latitude: tenant.latitude, longitude: tenant.longitude },
      );

      if (distance > tenant.geofenceRadiusMeters) {
        throw new BadRequestException(
          `You must be within ${tenant.geofenceRadiusMeters}m of the location to clock out`,
        );
      }
    }

    attendance.clockOutTime = new Date();
    attendance.clockOutLatitude = latitude;
    attendance.clockOutLongitude = longitude;
    attendance.status = AttendanceStatus.CLOCKED_OUT;

    // Calculate total hours
    const hours = (attendance.clockOutTime.getTime() - attendance.clockInTime.getTime()) / (1000 * 60 * 60);
    attendance.totalHours = Number(hours.toFixed(2));

    return this.attendanceRepository.save(attendance);
  }

  async approveAttendance(
    attendanceId: string,
    managerId: string,
    approvedHours?: number,
    managerNotes?: string,
  ): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id: attendanceId },
    });

    if (!attendance) {
      throw new BadRequestException('Attendance record not found');
    }

    attendance.approvedHours = approvedHours || attendance.totalHours;
    attendance.approvedByManagerId = managerId;
    attendance.approvedAt = new Date();
    attendance.managerNotes = managerNotes;
    attendance.status = AttendanceStatus.APPROVED;

    return this.attendanceRepository.save(attendance);
  }

  async getAttendanceByShift(shiftId: string): Promise<Attendance> {
    return this.attendanceRepository.findOne({
      where: { shiftId },
      relations: ['worker'],
    });
  }

  async getAttendanceByTenant(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Attendance[]> {
    const query = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.worker', 'worker')
      .leftJoinAndSelect('attendance.shift', 'shift')
      .where('attendance.tenantId = :tenantId', { tenantId });

    if (startDate && endDate) {
      query.andWhere('attendance.clockInTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.getMany();
  }
}
