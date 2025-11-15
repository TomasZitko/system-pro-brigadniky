import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new shift' })
  async createShift(@Body() shiftData: any, @CurrentUser() user: User) {
    return this.shiftsService.createShift({
      ...shiftData,
      tenantId: user.tenantId,
      createdByManagerId: user.id,
    });
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.FRANCHISE_HQ)
  @ApiOperation({ summary: 'Get all shifts for tenant' })
  async getShifts(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.shiftsService.getShiftsByTenant(
      user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('marketplace')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Get open shifts in marketplace' })
  async getMarketplaceShifts(@CurrentUser() user: User) {
    return this.shiftsService.getMarketplaceShifts(user.tenantId);
  }

  @Get('my-shifts')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Get my assigned shifts' })
  async getMyShifts(@CurrentUser() user: User) {
    return this.shiftsService.getWorkerShifts(user.id);
  }

  @Post(':shiftId/apply')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Apply to an open shift' })
  async applyToShift(
    @Param('shiftId') shiftId: string,
    @Body() body: { message?: string },
    @CurrentUser() user: User,
  ) {
    return this.shiftsService.applyToShift(shiftId, user.id, user.tenantId, body.message);
  }

  @Post('applications/:applicationId/approve')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve a shift application' })
  async approveApplication(@Param('applicationId') applicationId: string) {
    return this.shiftsService.approveApplication(applicationId);
  }

  @Put(':shiftId')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a shift' })
  async updateShift(@Param('shiftId') shiftId: string, @Body() updateData: any) {
    return this.shiftsService.updateShift(shiftId, updateData);
  }
}
