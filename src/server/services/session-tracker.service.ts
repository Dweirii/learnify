import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { XPService } from "./xp.service";

export interface StreamSessionData {
  id: string;
  userId: string;
  streamId: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes: number;
  peakViewers: number;
  isActive: boolean;
}

export interface ViewSessionData {
  id: string;
  userId: string;
  streamId: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes: number;
  isActive: boolean;
}

/**
 * Session Tracker Service
 * Handles tracking of streaming and viewing sessions for XP calculation
 */
export class SessionTrackerService {
  private static readonly REDIS_PREFIX = "session:";
  private static readonly ACTIVE_SESSION_TTL = 86400; // 24 hours

  /**
   * Start a streaming session
   * @param userId - User ID
   * @param streamId - Stream ID
   */
  static async startStreamSession(userId: string, streamId: string): Promise<string | null> {
    try {
      // Check if user already has an active stream session
      const existingSession = await db.streamSession.findFirst({
        where: {
          userId,
          isActive: true,
        },
        orderBy: { startTime: 'desc' },
      });

      if (existingSession) {
        logger.warn(`[SessionTracker] User ${userId} already has active stream session ${existingSession.id}`);
        return existingSession.id;
      }

      // Create new stream session
      const session = await db.streamSession.create({
        data: {
          userId,
          streamId,
          startTime: new Date(),
          isActive: true,
          durationMinutes: 0,
          peakViewers: 0,
        },
      });

      // Store in Redis for quick access
      await redis.setex(
        `${this.REDIS_PREFIX}stream:${session.id}`,
        this.ACTIVE_SESSION_TTL,
        JSON.stringify({
          id: session.id,
          userId,
          streamId,
          startTime: session.startTime.toISOString(),
          peakViewers: 0,
        })
      );

      logger.info(`[SessionTracker] Started stream session ${session.id} for user ${userId}`);
      return session.id;
    } catch (error) {
      logger.error(`[SessionTracker] Failed to start stream session for user ${userId}:`, error as Error);
      return null;
    }
  }

  /**
   * End a streaming session and award XP
   * @param sessionId - Session ID
   */
  static async endStreamSession(sessionId: string): Promise<boolean> {
    try {
      const session = await db.streamSession.findUnique({
        where: { id: sessionId },
        include: {
          stream: {
            select: { viewerCount: true },
          },
        },
      });

      if (!session) {
        logger.error(`[SessionTracker] Stream session ${sessionId} not found`);
        return false;
      }

      if (!session.isActive) {
        logger.warn(`[SessionTracker] Stream session ${sessionId} is already ended`);
        return true;
      }

      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / (1000 * 60));

      // Update session with end time and duration
      const updatedSession = await db.streamSession.update({
        where: { id: sessionId },
        data: {
          endTime,
          durationMinutes,
          isActive: false,
          peakViewers: Math.max(session.peakViewers, session.stream?.viewerCount || 0),
        },
      });

      // Award XP based on duration
      if (durationMinutes > 0) {
        const xpAmount = Math.floor(durationMinutes / 30) * XPService.XP_CONSTANTS.STREAM_DURATION_PER_30MIN;
        
        if (xpAmount > 0) {
          await XPService.awardXP(
            session.userId,
            xpAmount,
            "stream_duration",
            {
              sessionId,
              durationMinutes,
              streamId: session.streamId,
            }
          );
        }
      }

      // Update user's total stream minutes
      await XPService.updateActivityStats(session.userId, {
        streamMinutes: durationMinutes,
      });

      // Remove from Redis
      await redis.del(`${this.REDIS_PREFIX}stream:${sessionId}`);

      logger.info(`[SessionTracker] Ended stream session ${sessionId}, duration: ${durationMinutes}min`);
      return true;
    } catch (error) {
      logger.error(`[SessionTracker] Failed to end stream session ${sessionId}:`, error as Error);
      return false;
    }
  }

  /**
   * Start a viewing session
   * @param userId - User ID
   * @param streamId - Stream ID
   */
  static async startViewSession(userId: string, streamId: string): Promise<string | null> {
    try {
      // Check if user already has an active view session for this stream
      const existingSession = await db.viewSession.findFirst({
        where: {
          userId,
          streamId,
          isActive: true,
        },
        orderBy: { startTime: 'desc' },
      });

      if (existingSession) {
        logger.warn(`[SessionTracker] User ${userId} already has active view session ${existingSession.id} for stream ${streamId}`);
        return existingSession.id;
      }

      // Create new view session
      const session = await db.viewSession.create({
        data: {
          userId,
          streamId,
          startTime: new Date(),
          isActive: true,
          durationMinutes: 0,
        },
      });

      // Store in Redis for quick access
      await redis.setex(
        `${this.REDIS_PREFIX}view:${session.id}`,
        this.ACTIVE_SESSION_TTL,
        JSON.stringify({
          id: session.id,
          userId,
          streamId,
          startTime: session.startTime.toISOString(),
        })
      );

      logger.info(`[SessionTracker] Started view session ${session.id} for user ${userId}`);
      return session.id;
    } catch (error) {
      logger.error(`[SessionTracker] Failed to start view session for user ${userId}:`, error as Error);
      return null;
    }
  }

  /**
   * End a viewing session and award XP
   * @param sessionId - Session ID
   */
  static async endViewSession(sessionId: string): Promise<boolean> {
    try {
      const session = await db.viewSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        logger.error(`[SessionTracker] View session ${sessionId} not found`);
        return false;
      }

      if (!session.isActive) {
        logger.warn(`[SessionTracker] View session ${sessionId} is already ended`);
        return true;
      }

      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / (1000 * 60));

      // Update session with end time and duration
      await db.viewSession.update({
        where: { id: sessionId },
        data: {
          endTime,
          durationMinutes,
          isActive: false,
        },
      });

      // Award XP based on watch time
      if (durationMinutes > 0) {
        const xpAmount = Math.floor(durationMinutes / 30) * XPService.XP_CONSTANTS.WATCH_DURATION_PER_30MIN;
        
        if (xpAmount > 0) {
          await XPService.awardXP(
            session.userId,
            xpAmount,
            "watch_time",
            {
              sessionId,
              durationMinutes,
              streamId: session.streamId,
            }
          );
        }
      }

      // Update user's total watch minutes
      await XPService.updateActivityStats(session.userId, {
        watchMinutes: durationMinutes,
      });

      // Remove from Redis
      await redis.del(`${this.REDIS_PREFIX}view:${sessionId}`);

      logger.info(`[SessionTracker] Ended view session ${sessionId}, duration: ${durationMinutes}min`);
      return true;
    } catch (error) {
      logger.error(`[SessionTracker] Failed to end view session ${sessionId}:`, error as Error);
      return false;
    }
  }

  /**
   * Update active sessions and award XP for ongoing sessions
   * Called by background job every 15 minutes
   */
  static async updateActiveSessions(): Promise<{ processed: number; xpAwarded: number }> {
    try {
      let processed = 0;
      let xpAwarded = 0;

      // Get all active stream sessions
      const activeStreamSessions = await db.streamSession.findMany({
        where: { isActive: true },
        include: {
          stream: {
            select: { viewerCount: true },
          },
        },
      });

      // Get all active view sessions
      const activeViewSessions = await db.viewSession.findMany({
        where: { isActive: true },
      });

      const now = new Date();

      // Process active stream sessions
      for (const session of activeStreamSessions) {
        const durationMinutes = Math.floor((now.getTime() - session.startTime.getTime()) / (1000 * 60));
        
        // Award XP every 30 minutes
        const xpIntervals = Math.floor(durationMinutes / 30);
        const xpAmount = xpIntervals * XPService.XP_CONSTANTS.STREAM_DURATION_PER_30MIN;

        if (xpAmount > 0) {
          await XPService.awardXP(
            session.userId,
            xpAmount,
            "stream_duration",
            {
              sessionId: session.id,
              durationMinutes,
              streamId: session.streamId,
            }
          );
          xpAwarded += xpAmount;
        }

        // Update peak viewers
        const currentViewers = session.stream?.viewerCount || 0;
        if (currentViewers > session.peakViewers) {
          await db.streamSession.update({
            where: { id: session.id },
            data: { peakViewers: currentViewers },
          });
        }

        processed++;
      }

      // Process active view sessions
      for (const session of activeViewSessions) {
        const durationMinutes = Math.floor((now.getTime() - session.startTime.getTime()) / (1000 * 60));
        
        // Award XP every 30 minutes
        const xpIntervals = Math.floor(durationMinutes / 30);
        const xpAmount = xpIntervals * XPService.XP_CONSTANTS.WATCH_DURATION_PER_30MIN;

        if (xpAmount > 0) {
          await XPService.awardXP(
            session.userId,
            xpAmount,
            "watch_time",
            {
              sessionId: session.id,
              durationMinutes,
              streamId: session.streamId,
            }
          );
          xpAwarded += xpAmount;
        }

        processed++;
      }

      logger.info(`[SessionTracker] Updated ${processed} active sessions, awarded ${xpAwarded} XP`);
      return { processed, xpAwarded };
    } catch (error) {
      logger.error(`[SessionTracker] Failed to update active sessions:`, error as Error | undefined);
      return { processed: 0, xpAwarded: 0 };
    }
  }

  /**
   * Get active session for a user
   * @param userId - User ID
   * @param type - Session type ('stream' or 'view')
   */
  static async getActiveSession(userId: string, type: 'stream' | 'view'): Promise<string | null> {
    try {
      let session;
      
      if (type === 'stream') {
        session = await db.streamSession.findFirst({
          where: {
            userId,
            isActive: true,
          },
          orderBy: { startTime: 'desc' },
          select: { id: true },
        });
      } else {
        session = await db.viewSession.findFirst({
          where: {
            userId,
            isActive: true,
          },
          orderBy: { startTime: 'desc' },
          select: { id: true },
        });
      }
  
      return session?.id || null;
    } catch (error) {
      logger.error(`[SessionTracker] Failed to get active ${type} session for user ${userId}:`, error as Error);
      return null;
    }
  }

  /**
   * Get session statistics for a user
   * @param userId - User ID
   */
  static async getUserSessionStats(userId: string) {
    try {
      const [streamStats, viewStats] = await Promise.all([
        db.streamSession.aggregate({
          where: { userId },
          _sum: { durationMinutes: true },
          _count: { id: true },
        }),
        db.viewSession.aggregate({
          where: { userId },
          _sum: { durationMinutes: true },
          _count: { id: true },
        }),
      ]);

      return {
        totalStreamMinutes: streamStats._sum.durationMinutes || 0,
        totalViewMinutes: viewStats._sum.durationMinutes || 0,
        streamSessionsCount: streamStats._count.id,
        viewSessionsCount: viewStats._count.id,
      };
    } catch (error) {
      logger.error(`[SessionTracker] Failed to get session stats for user ${userId}:`, error as Error);
      return {
        totalStreamMinutes: 0,
        totalViewMinutes: 0,
        streamSessionsCount: 0,
        viewSessionsCount: 0,
      };
    }
  }

  /**
   * Clean up old sessions (older than 30 days)
   */
  static async cleanupOldSessions(): Promise<{ deleted: number }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [streamDeleted, viewDeleted] = await Promise.all([
        db.streamSession.deleteMany({
          where: {
            endTime: { lt: thirtyDaysAgo },
            isActive: false,
          },
        }),
        db.viewSession.deleteMany({
          where: {
            endTime: { lt: thirtyDaysAgo },
            isActive: false,
          },
        }),
      ]);

      const totalDeleted = streamDeleted.count + viewDeleted.count;
      logger.info(`[SessionTracker] Cleaned up ${totalDeleted} old sessions`);
      
      return { deleted: totalDeleted };
    } catch (error) {
      logger.error(`[SessionTracker] Failed to cleanup old sessions:`, error as Error);
      return { deleted: 0 };
    }
  }
}

// Export convenience functions
export const startStreamSession = SessionTrackerService.startStreamSession;
export const endStreamSession = SessionTrackerService.endStreamSession;
export const startViewSession = SessionTrackerService.startViewSession;
export const endViewSession = SessionTrackerService.endViewSession;
export const updateActiveSessions = SessionTrackerService.updateActiveSessions;