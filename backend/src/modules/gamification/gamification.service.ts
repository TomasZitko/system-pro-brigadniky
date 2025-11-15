import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { WorkerAchievement } from './entities/worker-achievement.entity';
import { LeaderboardEntry } from './entities/leaderboard-entry.entity';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(WorkerAchievement)
    private workerAchievementRepository: Repository<WorkerAchievement>,
    @InjectRepository(LeaderboardEntry)
    private leaderboardRepository: Repository<LeaderboardEntry>,
  ) {}

  async createAchievement(achievementData: Partial<Achievement>): Promise<Achievement> {
    const achievement = this.achievementRepository.create(achievementData);
    return this.achievementRepository.save(achievement);
  }

  async getAchievements(tenantId: string): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: { tenantId, isActive: true },
    });
  }

  async awardAchievement(
    tenantId: string,
    workerId: string,
    achievementId: string,
  ): Promise<WorkerAchievement> {
    // Check if already earned
    const existing = await this.workerAchievementRepository.findOne({
      where: { workerId, achievementId },
    });

    if (existing) {
      return existing;
    }

    const workerAchievement = this.workerAchievementRepository.create({
      tenantId,
      workerId,
      achievementId,
    });

    return this.workerAchievementRepository.save(workerAchievement);
  }

  async getWorkerAchievements(workerId: string): Promise<WorkerAchievement[]> {
    return this.workerAchievementRepository.find({
      where: { workerId },
      relations: ['achievement'],
    });
  }

  async getLeaderboard(tenantId: string): Promise<LeaderboardEntry[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.leaderboardRepository.find({
      where: {
        tenantId,
        periodStart: startOfMonth,
      },
      relations: ['worker'],
      order: { rank: 'ASC' },
    });
  }
}
