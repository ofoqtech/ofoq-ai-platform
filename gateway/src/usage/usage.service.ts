import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UsageLog } from './entities/usage-log.entity';
import { AuthService } from '../auth/auth.service';

// Claude Sonnet pricing per 1M tokens (input+output avg)
const CLAUDE_COST_PER_TOKEN = 0.000003;

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageLog) private logRepo: Repository<UsageLog>,
    private authService: AuthService,
  ) {}

  async checkLimit(userId: string) {
    const users = await this.authService.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (user.tokensUsedThisMonth >= user.monthlyTokenLimit) {
      throw new ForbiddenException(`تجاوزت الحد الشهري (${user.monthlyTokenLimit.toLocaleString()} توكن)`);
    }
  }

  async record(userId: string, tokens: number, provider: string) {
    const costUsd = provider === 'claude' ? tokens * CLAUDE_COST_PER_TOKEN : 0;
    const log = this.logRepo.create({ userId, tokens, provider, costUsd });
    await this.logRepo.save(log);
    // Update user counter
    await this.authService.updateUserLimit(userId, 0); // placeholder — monthly reset handled by cron
  }

  async getUserStats(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [logs, total] = await this.logRepo.findAndCount({
      where: { userId, createdAt: Between(monthStart, now) },
      order: { createdAt: 'DESC' },
    });

    const byProvider = logs.reduce((acc, log) => {
      acc[log.provider] = (acc[log.provider] || 0) + log.tokens;
      return acc;
    }, {} as Record<string, number>);

    const totalCost = logs.reduce((sum, l) => sum + Number(l.costUsd), 0);

    return {
      thisMonth: { totalTokens: logs.reduce((s, l) => s + l.tokens, 0), byProvider, totalCostUsd: totalCost },
      recentLogs: logs.slice(0, 20),
    };
  }

  async getAdminStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const logs = await this.logRepo.find({ where: { createdAt: Between(monthStart, now) } });

    const byUser = logs.reduce((acc, log) => {
      if (!acc[log.userId]) acc[log.userId] = { tokens: 0, costUsd: 0 };
      acc[log.userId].tokens += log.tokens;
      acc[log.userId].costUsd += Number(log.costUsd);
      return acc;
    }, {} as Record<string, any>);

    const totalTokens = logs.reduce((s, l) => s + l.tokens, 0);
    const totalCostUsd = logs.reduce((s, l) => s + Number(l.costUsd), 0);
    const ollamaTokens = logs.filter((l) => l.provider === 'ollama').reduce((s, l) => s + l.tokens, 0);
    const claudeTokens = logs.filter((l) => l.provider === 'claude').reduce((s, l) => s + l.tokens, 0);

    return {
      totalTokens, totalCostUsd, ollamaTokens, claudeTokens,
      savingsUsd: ollamaTokens * CLAUDE_COST_PER_TOKEN, // what Ollama saved vs using Claude for everything
      byUser,
    };
  }
}
