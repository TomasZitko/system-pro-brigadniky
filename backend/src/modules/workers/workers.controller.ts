import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WorkersService } from './workers.service';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Workers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workers')
export class WorkersController {
  constructor(private workersService: WorkersService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.FRANCHISE_HQ)
  @ApiOperation({ summary: 'Get all workers in tenant' })
  async getWorkers(@CurrentUser() user: User) {
    return this.workersService.getWorkersByTenant(user.tenantId);
  }

  @Post('contracts')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a DPP/DPČ contract' })
  async createContract(@Body() contractData: any, @CurrentUser() user: User) {
    return this.workersService.createContract({
      ...contractData,
      tenantId: user.tenantId,
    });
  }

  @Get(':workerId/contracts')
  @ApiOperation({ summary: 'Get worker contracts' })
  async getWorkerContracts(@Param('workerId') workerId: string) {
    return this.workersService.getWorkerContracts(workerId);
  }

  @Post('availability')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Set worker availability' })
  async setAvailability(@Body() availabilityData: any, @CurrentUser() user: User) {
    return this.workersService.setAvailability({
      ...availabilityData,
      userId: user.id,
      tenantId: user.tenantId,
    });
  }

  @Get(':workerId/availability')
  @ApiOperation({ summary: 'Get worker availability' })
  async getWorkerAvailability(@Param('workerId') workerId: string) {
    return this.workersService.getWorkerAvailability(workerId);
  }
}
