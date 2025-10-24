import { CacheService } from '@/server/services/cache.service';
import { logger } from '@/lib/logger';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: Record<string, unknown>) => string; // Custom key generator
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimitService {
  private static instance: RateLimitService;
  private configs: Map<string, RateLimitConfig> = new Map();

  private constructor() {
    this.setupDefaultConfigs();
  }

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  private setupDefaultConfigs(): void {
    // API endpoints rate limiting
    this.configs.set('api', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000, // 1000 requests per 15 minutes
    });

    // Authentication endpoints
    this.configs.set('auth', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // 10 auth attempts per 15 minutes
    });

    // Stream creation
    this.configs.set('stream-create', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // 5 streams per hour
    });

    // Cache API
    this.configs.set('cache-api', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 requests per minute
    });

    // Search API
    this.configs.set('search', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 searches per minute
    });

    // Follow/Block actions
    this.configs.set('social-actions', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 actions per minute
    });

    // General user actions
    this.configs.set('user-actions', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 actions per minute
    });

    logger.info('[RateLimit] Default configurations loaded');
  }

  async checkRateLimit(
    identifier: string,
    configKey: string,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const config = this.getConfig(configKey, customConfig);
    const key = `rate-limit:${configKey}:${identifier}`;
    
    try {
      // Get current count
      const currentCount = await this.getCurrentCount(key);
      const now = Date.now();
      const windowStart = now - config.windowMs;
      
      // Clean up old entries
      await this.cleanupOldEntries(key, windowStart);
      
      // Check if limit exceeded
      if (currentCount >= config.maxRequests) {
        const resetTime = await this.getResetTime(key);
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        
        logger.warn('[RateLimit] Rate limit exceeded', {
          identifier,
          configKey,
          currentCount,
          maxRequests: config.maxRequests,
          retryAfter,
        });
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter,
        };
      }
      
      // Increment counter
      await this.incrementCounter(key, config.windowMs);
      
      const remaining = config.maxRequests - currentCount - 1;
      const resetTime = now + config.windowMs;
      
      logger.debug('[RateLimit] Request allowed', {
        identifier,
        configKey,
        remaining,
        resetTime,
      });
      
      return {
        allowed: true,
        remaining,
        resetTime,
      };
    } catch (error) {
      logger.error('[RateLimit] Error checking rate limit', error as Error);
      
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
      };
    }
  }

  private getConfig(configKey: string, customConfig?: Partial<RateLimitConfig>): RateLimitConfig {
    const baseConfig = this.configs.get(configKey) || {
      windowMs: 60 * 1000,
      maxRequests: 100,
    };
    
    return {
      ...baseConfig,
      ...customConfig,
    };
  }

  private async getCurrentCount(key: string): Promise<number> {
    try {
      const count = await CacheService.getCacheMetricsByKey(key);
      return count.hits || 0;
    } catch {
      return 0;
    }
  }

  private async getResetTime(key: string): Promise<number> {
    try {
      // Get TTL for the key
      const ttl = await this.getKeyTTL(key);
      return Date.now() + (ttl * 1000);
    } catch {
      return Date.now() + (15 * 60 * 1000); // Default 15 minutes
    }
  }

  private async getKeyTTL(_key: string): Promise<number> {
    // This would need to be implemented in your Redis helpers
    // For now, return a default TTL
    return 15 * 60; // 15 minutes in seconds
  }

  private async cleanupOldEntries(_key: string, _windowStart: number): Promise<void> {
    // This would clean up old entries from the rate limit window
    // Implementation depends on your Redis setup
    logger.debug('[RateLimit] Cleaning up old entries', { key: _key, windowStart: _windowStart });
  }

  private async incrementCounter(key: string, windowMs: number): Promise<void> {
    try {
      // Increment counter with TTL
      const ttlSeconds = Math.ceil(windowMs / 1000);
      // Note: CacheService.set method needs to be implemented
      // For now, we'll just log the increment
      logger.debug('[RateLimit] Incrementing counter', { key, ttlSeconds });
    } catch (error) {
      logger.error('[RateLimit] Error incrementing counter', error as Error);
    }
  }

  // Helper methods for common rate limiting scenarios
  async checkAPIRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, 'api');
  }

  async checkAuthRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, 'auth');
  }

  async checkStreamCreateRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, 'stream-create');
  }

  async checkCacheAPIRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, 'cache-api');
  }

  async checkSearchRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, 'search');
  }

  async checkSocialActionsRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, 'social-actions');
  }

  async checkUserActionsRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, 'user-actions');
  }

  // Configuration management
  updateConfig(configKey: string, config: RateLimitConfig): void {
    this.configs.set(configKey, config);
    logger.info('[RateLimit] Configuration updated', { configKey, config });
  }

  getAllConfigs(): Map<string, RateLimitConfig> {
    return new Map(this.configs);
  }
}

export const rateLimitService = RateLimitService.getInstance();
