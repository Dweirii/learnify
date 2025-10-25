import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface XPAward {
  userId: string;
  amount: number;
  reason: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export interface UserStats {
  id: string;
  userId: string;
  totalXP: number;
  level: number;
  streamMinutes: number;
  watchMinutes: number;
  chatMessageCount: number;
  lastXPUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
  progressPercentage: number;
  xpNeeded: number;
}

/**
 * XP Service - Core gamification logic
 * Handles XP awarding, level calculations, and user stats
 */
export class XPService {
  /**
   * Award XP to a user
   * @param userId - User ID
   * @param amount - XP amount to award
   * @param reason - Reason for XP award
   * @param metadata - Additional data
   */
  static async awardXP(
    userId: string,
    amount: number,
    reason: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; newLevel?: number; oldLevel?: number }> {
    try {
      if (amount <= 0) {
        logger.warn(`[XP] Attempted to award non-positive XP: ${amount} to user ${userId}`);
        return { success: false };
      }

      // Use transaction to ensure atomicity
      const result = await db.$transaction(async (tx) => {
        // Get current user stats
        const currentStats = await tx.userStats.findUnique({
          where: { userId },
          select: {
            totalXP: true,
            level: true,
            streamMinutes: true,
            watchMinutes: true,
            chatMessageCount: true,
          },
        });

        if (!currentStats) {
          logger.error(`[XP] UserStats not found for user ${userId}`);
          throw new Error(`UserStats not found for user ${userId}`);
        }

        const oldLevel = currentStats.level;
        const newTotalXP = currentStats.totalXP + amount;
        const newLevel = this.calculateLevel(newTotalXP);

        // Update user stats
        const updatedStats = await tx.userStats.update({
          where: { userId },
          data: {
            totalXP: newTotalXP,
            level: newLevel,
            lastXPUpdate: new Date(),
          },
        });

        // Create XP transaction record
        await tx.xPTransaction.create({
          data: {
            userId,
            amount,
            reason,
            metadata: metadata || {},
          },
        });

        logger.info(`[XP] Awarded ${amount} XP to user ${userId} (${reason}). Level: ${oldLevel} → ${newLevel}`);

        return {
          success: true,
          newLevel,
          oldLevel,
          updatedStats,
        };
      });

      return {
        success: true,
        newLevel: result.newLevel,
        oldLevel: result.oldLevel,
      };
    } catch (error) {
      logger.error(`[XP] Failed to award XP to user ${userId}:`, error as Error);
      return { success: false };
    }
  }

  /**
   * Award XP to multiple users in batch
   * @param awards - Array of XP awards
   */
  static async bulkAwardXP(awards: XPAward[]): Promise<{ success: boolean; processed: number }> {
    try {
      let processed = 0;

      await db.$transaction(async (tx) => {
        for (const award of awards) {
          if (award.amount <= 0) continue;

          // Get current stats
          const currentStats = await tx.userStats.findUnique({
            where: { userId: award.userId },
            select: { totalXP: true, level: true },
          });

          if (!currentStats) continue;

          const newTotalXP = currentStats.totalXP + award.amount;
          const newLevel = this.calculateLevel(newTotalXP);

          // Update stats
          await tx.userStats.update({
            where: { userId: award.userId },
            data: {
              totalXP: newTotalXP,
              level: newLevel,
              lastXPUpdate: new Date(),
            },
          });

          // Create transaction record
          await tx.xPTransaction.create({
            data: {
              userId: award.userId,
              amount: award.amount,
              reason: award.reason,
              metadata: award.metadata || {},
            },
          });

          processed++;
        }
      });

      logger.info(`[XP] Bulk awarded XP to ${processed} users`);
      return { success: true, processed };
    } catch (error) {
      logger.error(`[XP] Failed bulk XP award:`, error as Error);
      return { success: false, processed: 0 };
    }
  }

  /**
   * Calculate user level based on total XP
   * Formula: level = floor(sqrt(totalXP / 100))
   * @param totalXP - Total XP amount
   */
  static calculateLevel(totalXP: number): number {
    if (totalXP < 0) return 1;
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  }

  /**
   * Get XP required for next level
   * @param currentLevel - Current level
   */
  static getXPForNextLevel(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    return (nextLevel * nextLevel) * 100;
  }

  /**
   * Get XP required for current level
   * @param currentLevel - Current level
   */
  static getXPForCurrentLevel(currentLevel: number): number {
    return (currentLevel * currentLevel) * 100;
  }

  /**
   * Calculate level progress
   * @param totalXP - Current total XP
   * @param level - Current level
   */
  static calculateLevelProgress(totalXP: number, level: number): LevelProgress {
    const xpForCurrentLevel = this.getXPForCurrentLevel(level);
    const xpForNextLevel = this.getXPForNextLevel(level);
    const currentXP = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - totalXP;
    const progressPercentage = Math.round((currentXP / (xpForNextLevel - xpForCurrentLevel)) * 100);

    return {
      currentLevel: level,
      currentXP,
      xpForNextLevel,
      progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
      xpNeeded: Math.max(0, xpNeeded),
    };
  }

  /**
   * Get user's gamification stats
   * @param userId - User ID
   */
  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const stats = await db.userStats.findUnique({
        where: { userId },
      });

      return stats;
    } catch (error) {
      logger.error(`[XP] Failed to get user stats for ${userId}:`, error as Error);
      return null;
    }
  }

  /**
   * Get user's level progress
   * @param userId - User ID
   */
  static async getUserLevelProgress(userId: string): Promise<LevelProgress | null> {
    try {
      const stats = await this.getUserStats(userId);
      if (!stats) return null;

      return this.calculateLevelProgress(stats.totalXP, stats.level);
    } catch (error) {
      logger.error(`[XP] Failed to get level progress for ${userId}:`, error as Error);
      return null;
    }
  }

  /**
   * Get recent XP transactions for a user
   * @param userId - User ID
   * @param limit - Number of transactions to return
   */
  static async getRecentXPTransactions(userId: string, limit: number = 10) {
    try {
      const transactions = await db.xPTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          amount: true,
          reason: true,
          metadata: true,
          createdAt: true,
        },
      });

      return transactions;
    } catch (error) {
      logger.error(`[XP] Failed to get recent transactions for ${userId}:`, error as Error);
      return [];
    }
  }

  /**
   * Get user's global rank by total XP
   * @param userId - User ID
   */
  static async getUserRank(userId: string): Promise<number | null> {
    try {
      const userStats = await db.userStats.findUnique({
        where: { userId },
        select: { totalXP: true },
      });

      if (!userStats) return null;

      const rank = await db.userStats.count({
        where: {
          totalXP: {
            gt: userStats.totalXP,
          },
        },
      });

      return rank + 1; // Rank is 1-based
    } catch (error) {
      logger.error(`[XP] Failed to get user rank for ${userId}:`, error as Error);
      return null;
    }
  }

  /**
   * Update activity stats (stream minutes, watch minutes, chat count)
   * @param userId - User ID
   * @param updates - Partial stats to update
   */
  static async updateActivityStats(
    userId: string,
    updates: {
      streamMinutes?: number;
      watchMinutes?: number;
      chatMessageCount?: number;
    }
  ): Promise<boolean> {
    try {
      await db.userStats.update({
        where: { userId },
        data: {
          ...updates,
          lastXPUpdate: new Date(),
        },
      });

      return true;
    } catch (error) {
      logger.error(`[XP] Failed to update activity stats for ${userId}:`, error as Error);
      return false;
    }
  }

  /**
   * Get XP constants for different actions
   */
  static readonly XP_CONSTANTS = {
    STREAM_START: 50,
    STREAM_DURATION_PER_30MIN: 25,
    WATCH_DURATION_PER_30MIN: 10,
    CHAT_MESSAGE: 1,
    FOLLOW_USER: 5,
    SCHEDULED_STREAM_BONUS: 15,
    VIEWER_MILESTONE_10: 20,
    VIEWER_MILESTONE_50: 50,
    VIEWER_MILESTONE_100: 100,
  } as const;
}

// Export convenience functions
export const awardXP = XPService.awardXP;
export const bulkAwardXP = XPService.bulkAwardXP;
export const calculateLevel = XPService.calculateLevel;
export const getUserStats = XPService.getUserStats;
export const getUserLevelProgress = XPService.getUserLevelProgress;
export const getUserRank = XPService.getUserRank;