import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  imageUrl: string;
  totalXP: number;
  level: number;
  streamMinutes?: number;
  watchMinutes?: number;
  peakViewers?: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  total: number;
  hasMore: boolean;
}

export type LeaderboardType = 'global' | 'weekly_streamers' | 'monthly_streamers';

/**
 * Leaderboard Service
 * Handles leaderboard calculations and Redis caching
 */
export class LeaderboardService {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = "leaderboard:";
  private static readonly DEFAULT_LIMIT = 50;

  /**
   * Get global leaderboard (top users by total XP)
   * @param limit - Number of entries to return
   * @param offset - Offset for pagination
   */
  static async getGlobalLeaderboard(
    limit: number = this.DEFAULT_LIMIT,
    offset: number = 0
  ): Promise<LeaderboardResult> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}global:${limit}:${offset}`;
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info(`[Leaderboard] Cache hit for global leaderboard`);
        return JSON.parse(cached);
      }

      // Get total count
      const total = await db.userStats.count();

      // Get leaderboard entries
      const userStats = await db.userStats.findMany({
        orderBy: { totalXP: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              imageUrl: true,
            },
          },
        },
      });

      const entries: LeaderboardEntry[] = userStats.map((stats, index) => ({
        rank: offset + index + 1,
        userId: stats.userId,
        username: stats.user.username,
        imageUrl: stats.user.imageUrl,
        totalXP: stats.totalXP,
        level: stats.level,
      }));

      const result: LeaderboardResult = {
        entries,
        total,
        hasMore: offset + limit < total,
      };

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      logger.info(`[Leaderboard] Generated global leaderboard: ${entries.length} entries`);
      return result;
    } catch (error) {
      logger.error(`[Leaderboard] Failed to get global leaderboard:`, error as Error);
      return { entries: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get weekly streamers leaderboard (top by stream minutes this week)
   */
  static async getWeeklyStreamersLeaderboard(): Promise<LeaderboardResult> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}weekly_streamers`;
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info(`[Leaderboard] Cache hit for weekly streamers leaderboard`);
        return JSON.parse(cached);
      }

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get streamers who streamed this week
      const streamSessions = await db.streamSession.findMany({
        where: {
          startTime: { gte: oneWeekAgo },
          isActive: false, // Only completed sessions
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              imageUrl: true,
            },
          },
        },
      });

      // Aggregate stream minutes per user
      const userStreamMinutes = new Map<string, {
        userId: string;
        username: string;
        imageUrl: string;
        totalMinutes: number;
        sessionCount: number;
      }>();

      for (const session of streamSessions) {
        const userId = session.userId;
        const existing = userStreamMinutes.get(userId);
        
        if (existing) {
          existing.totalMinutes += session.durationMinutes;
          existing.sessionCount += 1;
        } else {
          userStreamMinutes.set(userId, {
            userId,
            username: session.user.username,
            imageUrl: session.user.imageUrl,
            totalMinutes: session.durationMinutes,
            sessionCount: 1,
          });
        }
      }

      // Convert to array and sort by total minutes
      const sortedUsers = Array.from(userStreamMinutes.values())
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .slice(0, this.DEFAULT_LIMIT);

      const entries: LeaderboardEntry[] = sortedUsers.map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        imageUrl: user.imageUrl,
        totalXP: 0, // Not relevant for this leaderboard
        level: 0, // Not relevant for this leaderboard
        streamMinutes: user.totalMinutes,
      }));

      const result: LeaderboardResult = {
        entries,
        total: sortedUsers.length,
        hasMore: false,
      };

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      logger.info(`[Leaderboard] Generated weekly streamers leaderboard: ${entries.length} entries`);
      return result;
    } catch (error) {
      logger.error(`[Leaderboard] Failed to get weekly streamers leaderboard:`, error as Error);
      return { entries: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get monthly streamers leaderboard (top by peak viewers this month)
   */
  static async getMonthlyStreamersLeaderboard(): Promise<LeaderboardResult> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}monthly_streamers`;
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info(`[Leaderboard] Cache hit for monthly streamers leaderboard`);
        return JSON.parse(cached);
      }

      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get streamers who streamed this month
      const streamSessions = await db.streamSession.findMany({
        where: {
          startTime: { gte: oneMonthAgo },
          isActive: false, // Only completed sessions
          peakViewers: { gt: 0 }, // Only sessions with viewers
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { peakViewers: 'desc' },
      });

      // Get the best session per user (highest peak viewers)
      const userBestSessions = new Map<string, {
        userId: string;
        username: string;
        imageUrl: string;
        peakViewers: number;
        sessionCount: number;
      }>();

      for (const session of streamSessions) {
        const userId = session.userId;
        const existing = userBestSessions.get(userId);
        
        if (!existing || session.peakViewers > existing.peakViewers) {
          userBestSessions.set(userId, {
            userId,
            username: session.user.username,
            imageUrl: session.user.imageUrl,
            peakViewers: session.peakViewers,
            sessionCount: 1,
          });
        } else if (existing) {
          existing.sessionCount += 1;
        }
      }

      // Convert to array and sort by peak viewers
      const sortedUsers = Array.from(userBestSessions.values())
        .sort((a, b) => b.peakViewers - a.peakViewers)
        .slice(0, this.DEFAULT_LIMIT);

      const entries: LeaderboardEntry[] = sortedUsers.map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        imageUrl: user.imageUrl,
        totalXP: 0, // Not relevant for this leaderboard
        level: 0, // Not relevant for this leaderboard
        peakViewers: user.peakViewers,
      }));

      const result: LeaderboardResult = {
        entries,
        total: sortedUsers.length,
        hasMore: false,
      };

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      logger.info(`[Leaderboard] Generated monthly streamers leaderboard: ${entries.length} entries`);
      return result;
    } catch (error) {
      logger.error(`[Leaderboard] Failed to get monthly streamers leaderboard:`, error as Error);
      return { entries: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get user's global rank by total XP
   * @param userId - User ID
   */
  static async getUserRank(userId: string): Promise<number | null> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}rank:${userId}`;
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return parseInt(cached);
      }

      const userStats = await db.userStats.findUnique({
        where: { userId },
        select: { totalXP: true },
      });

      if (!userStats) {
        return null;
      }

      const rank = await db.userStats.count({
        where: {
          totalXP: { gt: userStats.totalXP },
        },
      });

      const userRank = rank + 1; // Rank is 1-based

      // Cache the rank for 1 minute
      await redis.setex(cacheKey, 60, userRank.toString());

      return userRank;
    } catch (error) {
      logger.error(`[Leaderboard] Failed to get user rank for ${userId}:`, error as Error);
      return null;
    }
  }

  /**
   * Get leaderboard by type
   * @param type - Leaderboard type
   * @param limit - Number of entries
   * @param offset - Offset for pagination
   */
  static async getLeaderboard(
    type: LeaderboardType,
    limit: number = this.DEFAULT_LIMIT,
    offset: number = 0
  ): Promise<LeaderboardResult> {
    switch (type) {
      case 'global':
        return this.getGlobalLeaderboard(limit, offset);
      case 'weekly_streamers':
        return this.getWeeklyStreamersLeaderboard();
      case 'monthly_streamers':
        return this.getMonthlyStreamersLeaderboard();
      default:
        throw new Error(`Unknown leaderboard type: ${type}`);
    }
  }

  /**
   * Invalidate leaderboard cache
   * Called when XP is awarded or user stats change
   */
  static async invalidateCache(): Promise<void> {
    try {
      const pattern = `${this.CACHE_PREFIX}*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`[Leaderboard] Invalidated ${keys.length} cache entries`);
      }
    } catch (error) {
      logger.error(`[Leaderboard] Failed to invalidate cache:`, error as Error);
    }
  }

  /**
   * Refresh all leaderboard caches
   * Called by background job every 5 minutes
   */
  static async refreshAllCaches(): Promise<{ refreshed: number }> {
    try {
      let refreshed = 0;

      // Refresh global leaderboard (first page)
      await this.getGlobalLeaderboard(this.DEFAULT_LIMIT, 0);
      refreshed++;

      // Refresh weekly streamers
      await this.getWeeklyStreamersLeaderboard();
      refreshed++;

      // Refresh monthly streamers
      await this.getMonthlyStreamersLeaderboard();
      refreshed++;

      logger.info(`[Leaderboard] Refreshed ${refreshed} leaderboard caches`);
      return { refreshed };
    } catch (error) {
      logger.error(`[Leaderboard] Failed to refresh caches:`, error as Error);
      return { refreshed: 0 };
    }
  }

  /**
   * Get leaderboard statistics
   */
  static async getLeaderboardStats(): Promise<{
    totalUsers: number;
    totalXP: number;
    averageLevel: number;
    topLevel: number;
  }> {
    try {
      const [totalUsers, stats] = await Promise.all([
        db.userStats.count(),
        db.userStats.aggregate({
          _sum: { totalXP: true },
          _avg: { level: true },
          _max: { level: true },
        }),
      ]);

      return {
        totalUsers,
        totalXP: stats._sum.totalXP || 0,
        averageLevel: Math.round(stats._avg.level || 0),
        topLevel: stats._max.level || 0,
      };
    } catch (error) {
      logger.error(`[Leaderboard] Failed to get leaderboard stats:`, error as Error);
      return {
        totalUsers: 0,
        totalXP: 0,
        averageLevel: 0,
        topLevel: 0,
      };
    }
  }
}

// Export convenience functions
export const getGlobalLeaderboard = LeaderboardService.getGlobalLeaderboard;
export const getWeeklyStreamersLeaderboard = LeaderboardService.getWeeklyStreamersLeaderboard;
export const getMonthlyStreamersLeaderboard = LeaderboardService.getMonthlyStreamersLeaderboard;
export const getUserRank = LeaderboardService.getUserRank;
export const getLeaderboard = LeaderboardService.getLeaderboard;
export const invalidateCache = LeaderboardService.invalidateCache;
export const refreshAllCaches = LeaderboardService.refreshAllCaches;