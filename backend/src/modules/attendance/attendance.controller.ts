import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('clock-in')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Clock in to a shift (with geofencing)' })
  async clockIn(
    @Body() body: { shiftId: string; latitude: number; longitude: number },
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.clockIn(
      body.shiftId,
      user.id,
      body.latitude,
      body.longitude,
    );
  }

  @Post('clock-out')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Clock out from a shift (with geofencing)' })
  async clockOut(
    @Body() body: { attendanceId: string; latitude: number; longitude: number },
  ) {
    return this.attendanceService.clockOut(
      body.attendanceId,
      body.latitude,
      body.longitude,
    );
  }

  @Put(':attendanceId/approve')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve attendance and hours' })
  async approveAttendance(
    @Param('attendanceId') attendanceId: string,
    @Body() body: { approvedHours?: number; managerNotes?: string },
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.approveAttendance(
      attendanceId,
      user.id,
      body.approvedHours,
      body.managerNotes,
    );
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.FRANCHISE_HQ)
  @ApiOperation({ summary: 'Get all attendance records for tenant' })
  async getAttendance(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getAttendanceByTenant(
      user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('shift/:shiftId')
  @ApiOperation({ summary: 'Get attendance for a specific shift' })
  async getAttendanceByShift(@Param('shiftId') shiftId: string) {
    return this.attendanceService.getAttendanceByShift(shiftId);
  }
}
