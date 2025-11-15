import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '@/common/guards';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get(':id')
  async getTenant(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/children')
  async getChildTenants(@Param('id') id: string) {
    return this.tenantsService.findChildTenants(id);
  }
}
