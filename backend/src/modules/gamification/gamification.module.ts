import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { Achievement } from './entities/achievement.entity';
import { WorkerAchievement } from './entities/worker-achievement.entity';
import { LeaderboardEntry } from './entities/leaderboard-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement, WorkerAchievement, LeaderboardEntry])],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
