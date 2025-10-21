import { db } from "@/lib/db";
import { streamCache, cacheHelpers } from "@/lib/redis";
import { getSelf } from "@/server/services/auth.service";
import { logger } from "@/lib/logger";

/**
 * Cache Service for Stream Data
 * 
 * This service provides caching layer for frequently accessed stream data
 * to reduce database load and improve response times.
 */

export class CacheService {
  /**
   * Get live streams with cache-first strategy
   */
  static async getLiveStreams(userId?: string) {
    // Try cache first
    const cachedStreams = await streamCache.getLiveStreams();
    if (cachedStreams) {
      logger.info("[Cache] Live streams served from cache");
      return cachedStreams;
    }

    // Cache miss - fetch from database
    logger.info("[Cache] Cache miss - fetching live streams from database");
    
    let streams = [];
    if (userId) {
      streams = await db.stream.findMany({
        where: {
          isLive: true,
          user: {
            NOT: {
              blocking: {
                some: {
                  blockedId: userId,
                },
              },
            },
          },
        },
        select: {
          user: true,
          id: true,
          name: true,
          isLive: true,
          thumbnailUrl: true,
          viewerCount: true,
          category: true,
          updatedAt: true,
        },
        orderBy: [
          { viewerCount: "desc" },
          { updatedAt: "desc" },
        ],
      });
    } else {
      streams = await db.stream.findMany({
        where: {
          isLive: true,
        },
        select: {
          user: true,
          id: true,
          name: true,
          isLive: true,
          thumbnailUrl: true,
          viewerCount: true,
          category: true,
          updatedAt: true,
        },
        orderBy: [
          { viewerCount: "desc" },
          { updatedAt: "desc" },
        ],
      });
    }

    // Cache the result
    await streamCache.setLiveStreams(streams);
    
    return streams;
  }

  /**
   * Get top live stream with cache-first strategy
   */
  static async getTopLiveStream() {
    // Try cache first
    const cachedStream = await streamCache.getTopLiveStream();
    if (cachedStream) {
      logger.info("[Cache] Top live stream served from cache");
      return cachedStream;
    }

    // Cache miss - fetch from database
    logger.info("[Cache] Cache miss - fetching top live stream from database");
    
    let userId: string | null = null;
    try {
      const self = await getSelf();
      userId = self.id;
    } catch {
      userId = null;
    }

    const stream = await db.stream.findFirst({
      where: {
        isLive: true,
        viewerCount: {
          gt: 0,
        },
        ...(userId && {
          user: {
            NOT: {
              blocking: {
                some: {
                  blockedId: userId,
                },
              },
            },
          },
        }),
      },
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        isLive: true,
        category: true,
        viewerCount: true,
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            bio: true,
            externalUserId: true,
          },
        },
      },
      orderBy: {
        viewerCount: "desc",
      },
    });

    // Cache the result (even if null)
    await streamCache.setTopLiveStream(stream);
    
    return stream;
  }

  /**
   * Get recommended streams with cache-first strategy
   */
  static async getRecommendedStreams(userId?: string) {
    const cacheKey = userId ? `recommended:${userId}` : "recommended:all";
    
    // Try cache first
    const cachedStreams = await cacheHelpers.get(cacheKey);
    if (cachedStreams) {
      logger.info("[Cache] Recommended streams served from cache");
      return cachedStreams;
    }

    // Cache miss - fetch from database
    logger.info("[Cache] Cache miss - fetching recommended streams from database");
    
    let streams = [];
    if (userId) {
      streams = await db.stream.findMany({
        where: {
          user: {
            NOT: {
              blocking: {
                some: {
                  blockedId: userId,
                },
              },
            },
          },
        },
        select: {
          user: true,
          id: true,
          name: true,
          isLive: true,
          thumbnailUrl: true,
          viewerCount: true,
          category: true,
          updatedAt: true,
        },
        orderBy: [
          { isLive: "desc" },
          { viewerCount: "desc" },
          { updatedAt: "desc" },
        ],
        take: 20,
      });
    } else {
      streams = await db.stream.findMany({
        select: {
          user: true,
          id: true,
          name: true,
          isLive: true,
          thumbnailUrl: true,
          viewerCount: true,
          category: true,
          updatedAt: true,
        },
        orderBy: [
          { isLive: "desc" },
          { viewerCount: "desc" },
          { updatedAt: "desc" },
        ],
        take: 20,
      });
    }

    // Cache the result
    await cacheHelpers.set(cacheKey, streams, 300); // 5 minutes TTL
    
    return streams;
  }

  /**
   * Get stream by user ID with cache-first strategy
   */
  static async getStreamByUserId(userId: string) {
    // Try cache first
    const cachedStream = await streamCache.getStreamByUserId(userId);
    if (cachedStream) {
      console.log("[Cache] Stream by user ID served from cache");
      return cachedStream;
    }

    // Cache miss - fetch from database
    console.log("[Cache] Cache miss - fetching stream by user ID from database");
    
    const stream = await db.stream.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        isLive: true,
        isChatEnabled: true,
        isChatDelayed: true,
        isChatFollowersOnly: true,
        viewerCount: true,
        category: true,
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            bio: true,
            externalUserId: true,
            _count: {
              select: {
                followedBy: true,
              },
            },
          },
        },
      },
    });

    // Cache the result (even if null)
    await streamCache.setStreamByUserId(userId, stream);
    
    return stream;
  }

  /**
   * Invalidate cache when stream data changes
   */
  static async invalidateStreamCache(streamId: string, userId?: string) {
    console.log(`[Cache] Invalidating cache for stream ${streamId}`);
    await streamCache.invalidateStream(streamId, userId);
  }

  /**
   * 🚀 OPTIMIZED: Smart cache invalidation based on change type
   */
  static async invalidateLiveStreamCaches() {
    logger.info("[Cache] Invalidating all live stream caches");
    await streamCache.invalidateLiveStreams();
  }

  /**
   * 🚀 NEW: Granular invalidation for viewer count changes
   */
  static async invalidateViewerCountCache(streamId: string) {
    logger.info(`[Cache] Invalidating viewer count cache for stream ${streamId}`);
    await streamCache.invalidateStreamViewerCount(streamId);
  }

  /**
   * 🚀 NEW: Smart invalidation for stream status changes
   */
  static async invalidateStreamStatusCache(streamId: string, isLive: boolean) {
    logger.info(`[Cache] Invalidating stream status cache for stream ${streamId} (live: ${isLive})`);
    await streamCache.invalidateStreamStatusChange(streamId, isLive);
  }

  /**
   * 🚀 NEW: Cache performance monitoring
   */
  static async getCachePerformanceStats() {
    return await streamCache.getCacheStats();
  }

  /**
   * Warm up cache with frequently accessed data
   */
  static async warmUpCache() {
    console.log("[Cache] Warming up cache...");
    
    try {
      // Pre-load live streams
      await this.getLiveStreams();
      
      // Pre-load top live stream
      await this.getTopLiveStream();
      
      // Pre-load recommendations
      await this.getRecommendedStreams();
      
      console.log("[Cache] Cache warmed up successfully");
    } catch (error) {
      console.error("[Cache] Failed to warm up cache:", error);
    }
  }
}
