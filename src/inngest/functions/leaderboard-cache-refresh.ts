import { inngest } from "@/lib/inngest";
import { LeaderboardService } from "@/server/services/leaderboard.service";
import { logger } from "@/lib/logger";

/**
 * Leaderboard Cache Refresh Inngest Function
 * Runs every 5 minutes to pre-compute and cache leaderboard data
 */
export const leaderboardCacheRefresh = inngest.createFunction(
  {
    id: "leaderboard-cache-refresh",
    name: "Leaderboard Cache Refresh",
    retries: 2,
    concurrency: {
      limit: 1, // Only one instance running at a time
    },
  },
  {
    // Run every 5 minutes
    cron: "*/5 * * * *",
  },
  async ({ event, step }) => {
    logger.info(`[Leaderboard Cache] Starting cache refresh job`, {
      eventType: event.name,
      timestamp: new Date().toISOString(),
    });

    // Step 1: Refresh global leaderboard cache
    const globalResult = await step.run("refresh-global-leaderboard", async () => {
      try {
        const result = await LeaderboardService.getGlobalLeaderboard(50, 0);
        logger.info(`[Leaderboard Cache] Refreshed global leaderboard`, {
          entries: result.entries.length,
          total: result.total,
        });
        return result;
      } catch (error) {
        logger.error(`[Leaderboard Cache] Failed to refresh global leaderboard:`, error as Error);
        throw error;
      }
    });

    // Step 2: Refresh weekly streamers cache
    const weeklyResult = await step.run("refresh-weekly-leaderboard", async () => {
      try {
        const result = await LeaderboardService.getWeeklyStreamersLeaderboard();
        logger.info(`[Leaderboard Cache] Refreshed weekly streamers leaderboard`, {
          entries: result.entries.length,
        });
        return result;
      } catch (error) {
        logger.error(`[Leaderboard Cache] Failed to refresh weekly leaderboard:`, error as Error);
        throw error;
      }
    });

    // Step 3: Refresh monthly streamers cache
    const monthlyResult = await step.run("refresh-monthly-leaderboard", async () => {
      try {
        const result = await LeaderboardService.getMonthlyStreamersLeaderboard();
        logger.info(`[Leaderboard Cache] Refreshed monthly streamers leaderboard`, {
          entries: result.entries.length,
        });
        return result;
      } catch (error) {
        logger.error(`[Leaderboard Cache] Failed to refresh monthly leaderboard:`, error as Error);
        throw error;
      }
    });

    // Step 4: Get leaderboard statistics
    const statsResult = await step.run("refresh-leaderboard-stats", async () => {
      try {
        const stats = await LeaderboardService.getLeaderboardStats();
        logger.info(`[Leaderboard Cache] Refreshed leaderboard stats`, stats);
        return stats;
      } catch (error) {
        logger.error(`[Leaderboard Cache] Failed to refresh leaderboard stats:`, error as Error);
        throw error;
      }
    });

    logger.info(`[Leaderboard Cache] Cache refresh job completed`, {
      globalEntries: globalResult.entries.length,
      weeklyEntries: weeklyResult.entries.length,
      monthlyEntries: monthlyResult.entries.length,
      totalUsers: statsResult.totalUsers,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      globalEntries: globalResult.entries.length,
      weeklyEntries: weeklyResult.entries.length,
      monthlyEntries: monthlyResult.entries.length,
      totalUsers: statsResult.totalUsers,
      timestamp: new Date().toISOString(),
    };
  }
);

/**
 * Manual leaderboard cache refresh trigger
 * Can be called manually for testing or immediate updates
 */
export const manualLeaderboardRefresh = inngest.createFunction(
  {
    id: "manual-leaderboard-refresh",
    name: "Manual Leaderboard Cache Refresh",
    retries: 2,
  },
  {
    event: "leaderboard/manual-refresh",
  },
  async ({ event, step }) => {
    logger.info(`[Manual Leaderboard] Starting manual cache refresh`, {
      triggeredBy: event.data?.userId || 'system',
    });

    // Refresh all caches
    const result = await step.run("refresh-all-caches", async () => {
      return await LeaderboardService.refreshAllCaches();
    });

    logger.info(`[Manual Leaderboard] Manual cache refresh completed`, {
      refreshed: result.refreshed,
    });

    return {
      success: true,
      refreshed: result.refreshed,
    };
  }
);