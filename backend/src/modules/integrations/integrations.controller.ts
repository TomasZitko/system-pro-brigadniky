import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '@/common/guards';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  @Post('pos/dotykacka')
  async connectDotykacka(@Body() body: { tenantId: string; apiKey: string }) {
    return this.integrationsService.connectPosToDotykacka(body.tenantId, body.apiKey);
  }
}
