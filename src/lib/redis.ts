import Redis from "ioredis";
import { logger } from './logger';

/**
 * Redis Client Configuration
 * 
 * Features:
 * - Connection pooling and retry logic
 * - Automatic reconnection
 * - Development vs production configuration
 * - Error handling and logging
 */

const redisConfig = {
  // Connection settings
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  
  // Connection pool settings
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  
  // Timeout settings
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Reconnection settings
  lazyConnect: true,
  keepAlive: 30000,
  
  // Development logging
  ...(process.env.NODE_ENV === "development" && {
    onConnect: () => logger.info("[Redis] Connected successfully"),
    onError: (err: Error) => logger.error("[Redis] Connection error", err),
    onReconnecting: () => logger.info("[Redis] Reconnecting..."),
  }),
};

// Create Redis instance
export const redis = new Redis(redisConfig);

// Global Redis instance for singleton pattern
declare global {
  var __redis: Redis | undefined;
}

// Use global instance in development to prevent multiple connections
if (process.env.NODE_ENV !== "production") {
  if (!global.__redis) {
    global.__redis = redis;
  }
}

export const redisClient = process.env.NODE_ENV !== "production" ? global.__redis! : redis;

/**
 * Redis Utility Functions
 */

// Cache key generators
export const cacheKeys = {
  liveStreams: () => "live_streams",
  streamById: (id: string) => `stream:${id}`,
  streamByUserId: (userId: string) => `stream:user:${userId}`,
  topLiveStream: () => "top_live_stream",
  recommendedStreams: (userId?: string) => userId ? `recommended:${userId}` : "recommended:all",
} as const;

// Cache TTL settings (in seconds)
export const cacheTTL = {
  liveStreams: 30,      // Live streams cache for 30 seconds
  streamDetails: 60,    // Individual stream details for 1 minute
  recommendations: 300, // Recommendations cache for 5 minutes
} as const;

/**
 * Cache Helper Functions
 */

export const cacheHelpers = {
  // Set cache with TTL
  async set(key: string, value: unknown, ttl: number = 60): Promise<void> {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`[Redis] Failed to set cache key ${key}`, error as Error);
    }
  },

  // Get cache value
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`[Redis] Failed to get cache key ${key}`, error as Error);
      return null;
    }
  },

  // Delete cache key
  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`[Redis] Failed to delete cache key ${key}`, error as Error);
    }
  },

  // Delete multiple keys with pattern
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      logger.error(`[Redis] Failed to delete pattern ${pattern}`, error as Error);
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`[Redis] Failed to check existence of key ${key}`, error as Error);
      return false;
    }
  },

  // Increment counter
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const result = await redisClient.incr(key);
      if (ttl) {
        await redisClient.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error(`[Redis] Failed to increment key ${key}`, error as Error);
      return 0;
    }
  },

  // Decrement counter
  async decr(key: string, ttl?: number): Promise<number> {
    try {
      const result = await redisClient.decr(key);
      if (ttl) {
        await redisClient.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error(`[Redis] Failed to decrement key ${key}`, error as Error);
      return 0;
    }
  },
};

/**
 * Stream-specific cache operations
 */
export const streamCache = {
  // Cache live streams list
  async setLiveStreams(streams: unknown[]): Promise<void> {
    await cacheHelpers.set(cacheKeys.liveStreams(), streams, cacheTTL.liveStreams);
  },

  // Get cached live streams
  async getLiveStreams(): Promise<unknown[] | null> {
    return await cacheHelpers.get(cacheKeys.liveStreams());
  },

  // Cache individual stream
  async setStream(streamId: string, stream: unknown): Promise<void> {
    await cacheHelpers.set(cacheKeys.streamById(streamId), stream, cacheTTL.streamDetails);
  },

  // Get cached stream
  async getStream(streamId: string): Promise<unknown | null> {
    return await cacheHelpers.get(cacheKeys.streamById(streamId));
  },

  // Cache stream by user ID
  async setStreamByUserId(userId: string, stream: unknown): Promise<void> {
    await cacheHelpers.set(cacheKeys.streamByUserId(userId), stream, cacheTTL.streamDetails);
  },

  // Get cached stream by user ID
  async getStreamByUserId(userId: string): Promise<unknown | null> {
    return await cacheHelpers.get(cacheKeys.streamByUserId(userId));
  },

  // Cache top live stream
  async setTopLiveStream(stream: unknown): Promise<void> {
    await cacheHelpers.set(cacheKeys.topLiveStream(), stream, cacheTTL.liveStreams);
  },

  // Get cached top live stream
  async getTopLiveStream(): Promise<unknown | null> {
    return await cacheHelpers.get(cacheKeys.topLiveStream());
  },

  // Invalidate stream-related caches
  async invalidateStream(streamId: string, userId?: string): Promise<void> {
    await Promise.all([
      cacheHelpers.del(cacheKeys.streamById(streamId)),
      cacheHelpers.del(cacheKeys.liveStreams()),
      cacheHelpers.del(cacheKeys.topLiveStream()),
      ...(userId ? [cacheHelpers.del(cacheKeys.streamByUserId(userId))] : []),
    ]);
  },

  // Invalidate all live stream caches
  async invalidateLiveStreams(): Promise<void> {
    await Promise.all([
      cacheHelpers.del(cacheKeys.liveStreams()),
      cacheHelpers.del(cacheKeys.topLiveStream()),
    ]);
  },

  // 🚀 NEW: Granular cache invalidation - only invalidate what's needed
  async invalidateStreamViewerCount(streamId: string): Promise<void> {
    // Only invalidate caches that depend on viewer count
    await Promise.all([
      cacheHelpers.del(cacheKeys.liveStreams()), // Viewer count affects sorting
      cacheHelpers.del(cacheKeys.topLiveStream()), // Viewer count affects top stream
    ]);
    logger.info(`[Cache] Viewer count invalidation for stream ${streamId}`);
  },

  // 🚀 NEW: Smart cache invalidation based on stream status changes
  async invalidateStreamStatusChange(streamId: string, isLive: boolean): Promise<void> {
    if (isLive) {
      // Stream went live - invalidate all live stream caches
      await this.invalidateLiveStreams();
    } else {
      // Stream went offline - invalidate specific caches
      await Promise.all([
        cacheHelpers.del(cacheKeys.streamById(streamId)),
        cacheHelpers.del(cacheKeys.liveStreams()),
        cacheHelpers.del(cacheKeys.topLiveStream()),
      ]);
    }
    logger.info(`[Cache] Stream status change invalidation for stream ${streamId} (live: ${isLive})`);
  },

  // 🚀 NEW: Cache warming for critical data
  async warmupCriticalCaches(): Promise<void> {
    logger.info("[Cache] Warming up critical caches...");
    // This would be called during app startup to pre-populate critical caches
    // Implementation would depend on your specific needs
  },

  // 🚀 NEW: Cache health monitoring
  async getCacheStats(): Promise<{ hitRate: number; totalKeys: number; memoryUsage: string }> {
    // This would return cache performance metrics
    // Implementation would depend on your Redis setup
    return {
      hitRate: 0.85, // Placeholder - would be calculated from actual metrics
      totalKeys: 0,
      memoryUsage: "0MB"
    };
  },
};

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("[Redis] Closing connection...");
  await redisClient.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("[Redis] Closing connection...");
  await redisClient.quit();
  process.exit(0);
});
