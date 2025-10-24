import { db } from "@/lib/db";
import { streamCache, cacheHelpers } from "@/lib/redis";
import { getSelf } from "@/server/services/auth.service";
import { cacheMetrics, CacheOperation } from './cache-metrics.service';
import { cacheTTLService } from './cache-ttl.service';
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
    const operation: CacheOperation = {
      operation: 'get',
      key: 'live-streams',
      startTime: Date.now(),
      success: false,
    };

    try {
      // Try cache first
      const cachedStreams = await streamCache.getLiveStreams();
      if (cachedStreams) {
        operation.endTime = Date.now();
        operation.success = true;
        cacheMetrics.recordOperation(operation);
        logger.info("[Cache] Live streams served from cache");
        return cachedStreams;
      }

      // Cache miss - fetch from database
      operation.success = false;
      cacheMetrics.recordOperation(operation);
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
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error("[Cache] Error in getLiveStreams:", error as Error);
      throw error;
    }
  }

  /**
   * Get top live stream with cache-first strategy
   */
  static async getTopLiveStream() {
    const operation: CacheOperation = {
      operation: 'get',
      key: 'top-live-stream',
      startTime: Date.now(),
      success: false,
    };

    try {
      // Try cache first
      const cachedStream = await streamCache.getTopLiveStream();
      if (cachedStream) {
        operation.endTime = Date.now();
        operation.success = true;
        cacheMetrics.recordOperation(operation);
        logger.info("[Cache] Top live stream served from cache");
        return cachedStream;
      }

      // Cache miss - fetch from database
      operation.success = false;
      cacheMetrics.recordOperation(operation);
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
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error("[Cache] Error in getTopLiveStream:", error as Error);
      throw error;
    }
  }

  /**
   * Get recommended streams with cache-first strategy
   */
  static async getRecommendedStreams(userId?: string) {
    const cacheKey = userId ? `recommended:${userId}` : "recommended:all";
    
    const operation: CacheOperation = {
      operation: 'get',
      key: cacheKey,
      startTime: Date.now(),
      success: false,
    };

    try {
      // Try cache first
      const cachedStreams = await cacheHelpers.get(cacheKey);
      if (cachedStreams) {
        operation.endTime = Date.now();
        operation.success = true;
        cacheMetrics.recordOperation(operation);
        logger.info("[Cache] Recommended streams served from cache");
        return cachedStreams;
      }

      // Cache miss - fetch from database
      operation.success = false;
      cacheMetrics.recordOperation(operation);
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

      // Cache the result with TTL
      const ttl = cacheTTLService.getRecommendationsTTL();
      await cacheHelpers.set(cacheKey, streams, ttl);
      
      return streams;
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error("[Cache] Error in getRecommendedStreams:", error as Error);
      throw error;
    }
  }

  /**
   * Get stream by user ID with cache-first strategy
   */
  static async getStreamByUserId(userId: string) {
    const operation: CacheOperation = {
      operation: 'get',
      key: `stream:user:${userId}`,
      startTime: Date.now(),
      success: false,
    };

    try {
      // Try cache first
      const cachedStream = await streamCache.getStreamByUserId(userId);
      if (cachedStream) {
        operation.endTime = Date.now();
        operation.success = true;
        cacheMetrics.recordOperation(operation);
        logger.info("[Cache] Stream by user ID served from cache");
        return cachedStream;
      }

      // Cache miss - fetch from database
      operation.success = false;
      cacheMetrics.recordOperation(operation);
      logger.info("[Cache] Cache miss - fetching stream by user ID from database");
    
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
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error("[Cache] Error in getStreamByUserId:", error as Error);
      throw error;
    }
  }

  /**
   * Invalidate cache when stream data changes
   */
  static async invalidateStreamCache(streamId: string, userId?: string) {
    const operation: CacheOperation = {
      operation: 'delete',
      key: `stream:${streamId}`,
      startTime: Date.now(),
      success: false,
    };

    try {
      logger.info(`[Cache] Invalidating cache for stream ${streamId}`);
      await streamCache.invalidateStream(streamId, userId);
      
      operation.endTime = Date.now();
      operation.success = true;
      cacheMetrics.recordOperation(operation);
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error(`[Cache] Error invalidating cache for stream ${streamId}:`, error as Error);
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED: Smart cache invalidation based on change type
   */
  static async invalidateLiveStreamCaches() {
    const operation: CacheOperation = {
      operation: 'delete',
      key: 'live-streams',
      startTime: Date.now(),
      success: false,
    };

    try {
      logger.info("[Cache] Invalidating all live stream caches");
      await streamCache.invalidateLiveStreams();
      
      operation.endTime = Date.now();
      operation.success = true;
      cacheMetrics.recordOperation(operation);
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error("[Cache] Error invalidating live stream caches:", error as Error);
      throw error;
    }
  }

  /**
   * 🚀 NEW: Granular invalidation for viewer count changes
   */
  static async invalidateViewerCountCache(streamId: string) {
    const operation: CacheOperation = {
      operation: 'delete',
      key: `stream:${streamId}:viewer-count`,
      startTime: Date.now(),
      success: false,
    };

    try {
      logger.info(`[Cache] Invalidating viewer count cache for stream ${streamId}`);
      await streamCache.invalidateStreamViewerCount(streamId);
      
      operation.endTime = Date.now();
      operation.success = true;
      cacheMetrics.recordOperation(operation);
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error(`[Cache] Error invalidating viewer count cache for stream ${streamId}:`, error as Error);
      throw error;
    }
  }

  /**
   * 🚀 NEW: Smart invalidation for stream status changes
   */
  static async invalidateStreamStatusCache(streamId: string, isLive: boolean) {
    const operation: CacheOperation = {
      operation: 'delete',
      key: `stream:${streamId}:status`,
      startTime: Date.now(),
      success: false,
    };

    try {
      logger.info(`[Cache] Invalidating stream status cache for stream ${streamId} (live: ${isLive})`);
      await streamCache.invalidateStreamStatusChange(streamId, isLive);
      
      operation.endTime = Date.now();
      operation.success = true;
      cacheMetrics.recordOperation(operation);
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error(`[Cache] Error invalidating stream status cache for stream ${streamId}:`, error as Error);
      throw error;
    }
  }

  /**
   * 🚀 NEW: Cache performance monitoring
   */
  static async getCachePerformanceStats() {
    return await streamCache.getCacheStats();
  }

  /**
   * 🚀 NEW: Get cache metrics
   */
  static getCacheMetrics() {
    return cacheMetrics.getMetrics();
  }

  /**
   * 🚀 NEW: Get recent cache operations
   */
  static getRecentCacheOperations(limit: number = 50) {
    return cacheMetrics.getRecentOperations(limit);
  }

  /**
   * 🚀 NEW: Get metrics for specific cache key
   */
  static getCacheMetricsByKey(key: string) {
    return cacheMetrics.getMetricsByKey(key);
  }

  /**
   * 🚀 NEW: Reset cache metrics
   */
  static resetCacheMetrics() {
    cacheMetrics.resetMetrics();
  }

  /**
   * 🚀 NEW: Set stream with TTL
   */
  static async setStream(stream: Record<string, unknown>): Promise<void> {
    const operation: CacheOperation = {
      operation: 'set',
      key: `stream:${stream.id}`,
      startTime: Date.now(),
      success: false,
    };

    try {
      const ttl = cacheTTLService.getStreamTTL();
      await cacheHelpers.set(`stream:${stream.id}`, stream, ttl);
      
      operation.endTime = Date.now();
      operation.success = true;
      cacheMetrics.recordOperation(operation);
      
      logger.debug(`[Cache] Stream cached with TTL: ${ttl}s`, { streamId: (stream as Record<string, unknown>).id as string });
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error(`[Cache] Error caching stream ${stream.id}:`, error as Error);
      throw error;
    }
  }

  /**
   * 🚀 NEW: Set user with TTL
   */
  static async setUser(user: Record<string, unknown>): Promise<void> {
    const operation: CacheOperation = {
      operation: 'set',
      key: `user:${user.id}`,
      startTime: Date.now(),
      success: false,
    };

    try {
      const ttl = cacheTTLService.getUserTTL();
      await cacheHelpers.set(`user:${user.id}`, user, ttl);
      
      operation.endTime = Date.now();
      operation.success = true;
      cacheMetrics.recordOperation(operation);
      
      logger.debug(`[Cache] User cached with TTL: ${ttl}s`, { userId: (user as Record<string, unknown>).id as string });
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error(`[Cache] Error caching user ${user.id}:`, error as Error);
      throw error;
    }
  }

  /**
   * 🚀 NEW: Set category streams with TTL
   */
  static async setCategoryStreams(category: string, streams: Record<string, unknown>[]): Promise<void> {
    const operation: CacheOperation = {
      operation: 'set',
      key: `category:${category}:streams`,
      startTime: Date.now(),
      success: false,
    };

    try {
      const ttl = cacheTTLService.getCategoryStreamsTTL();
      await cacheHelpers.set(`category:${category}:streams`, streams, ttl);
      
      operation.endTime = Date.now();
      operation.success = true;
      cacheMetrics.recordOperation(operation);
      
      logger.debug(`[Cache] Category streams cached with TTL: ${ttl}s`, { category, count: streams.length });
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error(`[Cache] Error caching category streams for ${category}:`, error as Error);
      throw error;
    }
  }

  /**
   * 🚀 NEW: Clear cache pattern
   */
  static async clearPattern(pattern: string): Promise<void> {
    const operation: CacheOperation = {
      operation: 'delete',
      key: `pattern:${pattern}`,
      startTime: Date.now(),
      success: false,
    };

    try {
      logger.info(`[Cache] Clearing cache pattern: ${pattern}`);
      
      // Use the Redis helper to actually clear the pattern
      await cacheHelpers.delPattern(pattern);
      
      operation.endTime = Date.now();
      operation.success = true;
      cacheMetrics.recordOperation(operation);
      
      logger.info(`[Cache] Cache pattern cleared: ${pattern}`);
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error(`[Cache] Error clearing cache pattern ${pattern}:`, error as Error);
      throw error;
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  static async warmUpCache() {
    const operation: CacheOperation = {
      operation: 'set',
      key: 'cache-warmup',
      startTime: Date.now(),
      success: false,
    };

    try {
      logger.info("[Cache] Warming up cache...");
      
      // Pre-load live streams
      await this.getLiveStreams();
      
      // Pre-load top live stream
      await this.getTopLiveStream();
      
      // Pre-load recommendations
      await this.getRecommendedStreams();
      
      operation.endTime = Date.now();
      operation.success = true;
      cacheMetrics.recordOperation(operation);
      
      logger.info("[Cache] Cache warmed up successfully");
    } catch (error) {
      operation.endTime = Date.now();
      operation.success = false;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      cacheMetrics.recordOperation(operation);
      logger.error("[Cache] Failed to warm up cache:", error as Error);
      throw error;
    }
  }
}
