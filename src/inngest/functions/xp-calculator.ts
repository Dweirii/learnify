import { inngest } from "@/lib/inngest";
import { SessionTrackerService } from "@/server/services/session-tracker.service";
import { LeaderboardService } from "@/server/services/leaderboard.service";
import { logger } from "@/lib/logger";

/**
 * XP Calculator Inngest Function
 * Runs every 15 minutes to award XP for active streaming/viewing sessions
 * and refresh leaderboard caches
 */
export const xpCalculator = inngest.createFunction(
  {
    id: "xp-calculator",
    name: "XP Calculator - Award XP for Active Sessions",
    retries: 3,
    concurrency: {
      limit: 1, // Only one instance running at a time
    },
  },
  {
    // Run every 15 minutes
    cron: "*/15 * * * *",
  },
  async ({ event, step }) => {
    logger.info(`[XP Calculator] Starting XP calculation job`, {
      eventType: event.name,
      timestamp: new Date().toISOString(),
    });

    // Step 1: Update active sessions and award XP
    const sessionResult = await step.run("update-active-sessions", async () => {
      try {
        const result = await SessionTrackerService.updateActiveSessions();
        logger.info(`[XP Calculator] Updated active sessions`, {
          processed: result.processed,
          xpAwarded: result.xpAwarded,
        });
        return result;
      } catch (error) {
        logger.error(`[XP Calculator] Failed to update active sessions:`, error as Error);
        throw error;
      }
    });

    // Step 2: Refresh leaderboard caches if XP was awarded
    if (sessionResult.xpAwarded > 0) {
      await step.run("refresh-leaderboard-caches", async () => {
        try {
          const result = await LeaderboardService.refreshAllCaches();
          logger.info(`[XP Calculator] Refreshed leaderboard caches`, {
            refreshed: result.refreshed,
          });
          return result;
        } catch (error) {
          logger.error(`[XP Calculator] Failed to refresh leaderboard caches:`, error as Error);
          // Don't throw - this is not critical
        }
      });
    }

    // Step 3: Clean up old sessions (run less frequently)
    const shouldCleanup = Math.random() < 0.1; // 10% chance each run
    if (shouldCleanup) {
      await step.run("cleanup-old-sessions", async () => {
        try {
          const result = await SessionTrackerService.cleanupOldSessions();
          logger.info(`[XP Calculator] Cleaned up old sessions`, {
            deleted: result.deleted,
          });
          return result;
        } catch (error) {
          logger.error(`[XP Calculator] Failed to cleanup old sessions:`, error as Error);
          // Don't throw - this is not critical
        }
      });
    }

    logger.info(`[XP Calculator] XP calculation job completed`, {
      sessionsProcessed: sessionResult.processed,
      xpAwarded: sessionResult.xpAwarded,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      sessionsProcessed: sessionResult.processed,
      xpAwarded: sessionResult.xpAwarded,
      timestamp: new Date().toISOString(),
    };
  }
);

/**
 * Manual XP calculation trigger
 * Can be called manually for testing or immediate updates
 */
export const manualXpCalculation = inngest.createFunction(
  {
    id: "manual-xp-calculation",
    name: "Manual XP Calculation",
    retries: 2,
  },
  {
    event: "xp/manual-calculation",
  },
  async ({ event, step }) => {
    logger.info(`[Manual XP] Starting manual XP calculation`, {
      triggeredBy: event.data?.userId || 'system',
    });

    // Update active sessions
    const sessionResult = await step.run("update-active-sessions", async () => {
      return await SessionTrackerService.updateActiveSessions();
    });

    // Refresh all caches
    await step.run("refresh-all-caches", async () => {
      return await LeaderboardService.refreshAllCaches();
    });

    logger.info(`[Manual XP] Manual XP calculation completed`, {
      sessionsProcessed: sessionResult.processed,
      xpAwarded: sessionResult.xpAwarded,
    });

    return {
      success: true,
      sessionsProcessed: sessionResult.processed,
      xpAwarded: sessionResult.xpAwarded,
    };
  }
);