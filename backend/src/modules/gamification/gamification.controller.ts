import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Post('achievements')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new achievement' })
  async createAchievement(@Body() achievementData: any, @CurrentUser() user: User) {
    return this.gamificationService.createAchievement({
      ...achievementData,
      tenantId: user.tenantId,
    });
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get all achievements' })
  async getAchievements(@CurrentUser() user: User) {
    return this.gamificationService.getAchievements(user.tenantId);
  }

  @Get('my-achievements')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Get my achievements' })
  async getMyAchievements(@CurrentUser() user: User) {
    return this.gamificationService.getWorkerAchievements(user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  async getLeaderboard(@CurrentUser() user: User) {
    return this.gamificationService.getLeaderboard(user.tenantId);
  }

  @Post('achievements/:achievementId/award/:workerId')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Award achievement to worker' })
  async awardAchievement(
    @Param('achievementId') achievementId: string,
    @Param('workerId') workerId: string,
    @CurrentUser() user: User,
  ) {
    return this.gamificationService.awardAchievement(
      user.tenantId,
      workerId,
      achievementId,
    );
  }
}
