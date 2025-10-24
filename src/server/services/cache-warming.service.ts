import { CacheService } from './cache.service';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface CacheWarmingConfig {
  enabled: boolean;
  intervalMinutes: number;
  batchSize: number;
  priorities: {
    liveStreams: number;
    popularStreams: number;
    userProfiles: number;
    categories: number;
  };
}

export class CacheWarmingService {
  private static instance: CacheWarmingService;
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: CacheWarmingConfig;

  private constructor() {
    this.config = {
      enabled: process.env.CACHE_WARMING_ENABLED === 'true',
      intervalMinutes: parseInt(process.env.CACHE_WARMING_INTERVAL || '5'),
      batchSize: parseInt(process.env.CACHE_WARMING_BATCH_SIZE || '50'),
      priorities: {
        liveStreams: 1,
        popularStreams: 2,
        userProfiles: 3,
        categories: 4,
      },
    };
  }

  static getInstance(): CacheWarmingService {
    if (!CacheWarmingService.instance) {
      CacheWarmingService.instance = new CacheWarmingService();
    }
    return CacheWarmingService.instance;
  }

  start(): void {
    if (this.isRunning || !this.config.enabled) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.warmCache();
    }, this.config.intervalMinutes * 60 * 1000);
    
    // Initial warm-up
    this.warmCache();
    
    logger.info('[CacheWarming] Service started', {
      interval: this.config.intervalMinutes,
      batchSize: this.config.batchSize,
    });
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('[CacheWarming] Service stopped');
  }

  async warmCache(): Promise<void> {
    try {
      logger.info('[CacheWarming] Starting cache warm-up');
      
      // Warm up in priority order
      await this.warmLiveStreams();
      await this.warmPopularStreams();
      await this.warmUserProfiles();
      await this.warmCategories();
      
      logger.info('[CacheWarming] Cache warm-up completed');
    } catch (error) {
      logger.error('[CacheWarming] Error during cache warm-up:', error as Error);
    }
  }

  private async warmLiveStreams(): Promise<void> {
    try {
      const liveStreams = await db.stream.findMany({
        where: { isLive: true },
        take: this.config.batchSize,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              imageUrl: true,
              bio: true,
              externalUserId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { viewerCount: 'desc' },
      });

      for (const stream of liveStreams) {
        await CacheService.setStream(stream);
        await CacheService.setUser(stream.user);
      }

      logger.info(`[CacheWarming] Warmed ${liveStreams.length} live streams`);
    } catch (error) {
      logger.error('[CacheWarming] Error warming live streams:', error as Error);
    }
  }

  private async warmPopularStreams(): Promise<void> {
    try {
      const popularStreams = await db.stream.findMany({
        where: { isLive: true },
        take: this.config.batchSize,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              imageUrl: true,
              bio: true,
              externalUserId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: [
          { viewerCount: 'desc' },
          { updatedAt: 'desc' },
        ],
      });

      for (const stream of popularStreams) {
        await CacheService.setStream(stream);
      }

      logger.info(`[CacheWarming] Warmed ${popularStreams.length} popular streams`);
    } catch (error) {
      logger.error('[CacheWarming] Error warming popular streams:', error as Error);
    }
  }

  private async warmUserProfiles(): Promise<void> {
    try {
      const activeUsers = await db.user.findMany({
        take: this.config.batchSize,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          username: true,
          imageUrl: true,
          bio: true,
          externalUserId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      for (const user of activeUsers) {
        await CacheService.setUser(user);
      }

      logger.info(`[CacheWarming] Warmed ${activeUsers.length} user profiles`);
    } catch (error) {
      logger.error('[CacheWarming] Error warming user profiles:', error as Error);
    }
  }

  private async warmCategories(): Promise<void> {
    try {
      const categories = await db.stream.findMany({
        select: { category: true },
        distinct: ['category'],
        where: { 
          category: { not: null },
          isLive: true,
        } as Record<string, unknown>,
      });

      for (const { category } of categories) {
        if (category) {
          await CacheService.setCategoryStreams(category, []);
        }
      }

      logger.info(`[CacheWarming] Warmed ${categories.length} categories`);
    } catch (error) {
      logger.error('[CacheWarming] Error warming categories:', error as Error);
    }
  }

  getConfig(): CacheWarmingConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<CacheWarmingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('[CacheWarming] Configuration updated', { config: this.config } as Record<string, unknown>);
  }
}

export const cacheWarmingService = CacheWarmingService.getInstance();