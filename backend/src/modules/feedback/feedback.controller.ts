import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post('qr-codes')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate a QR code for feedback' })
  async generateQrCode(
    @Body() body: { workerId?: string; label?: string },
    @CurrentUser() user: User,
  ) {
    return this.feedbackService.generateQrCode(user.tenantId, body.workerId, body.label);
  }

  @Post(':qrCode/submit')
  @ApiOperation({ summary: 'Submit customer feedback (public endpoint)' })
  async submitFeedback(
    @Param('qrCode') qrCode: string,
    @Body() body: { rating: string; tags?: string[]; comment?: string },
    @Req() req: Request,
  ) {
    return this.feedbackService.submitFeedback(
      qrCode,
      body.rating,
      body.tags,
      body.comment,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('my-reviews')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Get my customer reviews' })
  async getMyReviews(@CurrentUser() user: User) {
    return this.feedbackService.getWorkerFeedback(user.id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.FRANCHISE_HQ)
  @ApiOperation({ summary: 'Get all feedback for tenant' })
  async getTenantFeedback(@CurrentUser() user: User) {
    return this.feedbackService.getTenantFeedback(user.tenantId);
  }
}
