import { logger } from '@/lib/logger';

export interface TTLConfig {
  // Stream-related TTLs
  stream: number;           // 5 minutes
  streamList: number;       // 1 minute
  streamStatus: number;     // 30 seconds
  
  // User-related TTLs
  user: number;            // 10 minutes
  userStreams: number;     // 2 minutes
  
  // Category-related TTLs
  categoryStreams: number; // 2 minutes
  categories: number;      // 30 minutes
  
  // Follow/Block TTLs
  followers: number;       // 5 minutes
  following: number;       // 5 minutes
  blocked: number;         // 5 minutes
  
  // Search TTLs
  searchResults: number;   // 1 minute
  recommendations: number; // 5 minutes
}

export class CacheTTLService {
  private static instance: CacheTTLService;
  private config: TTLConfig;

  private constructor() {
    this.config = {
      // Stream-related TTLs (in seconds)
      stream: parseInt(process.env.CACHE_TTL_STREAM || '300'),           // 5 minutes
      streamList: parseInt(process.env.CACHE_TTL_STREAM_LIST || '60'),   // 1 minute
      streamStatus: parseInt(process.env.CACHE_TTL_STREAM_STATUS || '30'), // 30 seconds
      
      // User-related TTLs
      user: parseInt(process.env.CACHE_TTL_USER || '600'),                // 10 minutes
      userStreams: parseInt(process.env.CACHE_TTL_USER_STREAMS || '120'),  // 2 minutes
      
      // Category-related TTLs
      categoryStreams: parseInt(process.env.CACHE_TTL_CATEGORY_STREAMS || '120'), // 2 minutes
      categories: parseInt(process.env.CACHE_TTL_CATEGORIES || '1800'),    // 30 minutes
      
      // Follow/Block TTLs
      followers: parseInt(process.env.CACHE_TTL_FOLLOWERS || '300'),      // 5 minutes
      following: parseInt(process.env.CACHE_TTL_FOLLOWING || '300'),       // 5 minutes
      blocked: parseInt(process.env.CACHE_TTL_BLOCKED || '300'),           // 5 minutes
      
      // Search TTLs
      searchResults: parseInt(process.env.CACHE_TTL_SEARCH || '60'),      // 1 minute
      recommendations: parseInt(process.env.CACHE_TTL_RECOMMENDATIONS || '300'), // 5 minutes
    };
  }

  static getInstance(): CacheTTLService {
    if (!CacheTTLService.instance) {
      CacheTTLService.instance = new CacheTTLService();
    }
    return CacheTTLService.instance;
  }

  getTTL(keyType: keyof TTLConfig): number {
    return this.config[keyType];
  }

  getConfig(): TTLConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<TTLConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('[CacheTTL] Configuration updated', { config: this.config });
  }

  // Helper methods for common cache keys
  getStreamTTL(): number {
    return this.config.stream;
  }

  getStreamListTTL(): number {
    return this.config.streamList;
  }

  getStreamStatusTTL(): number {
    return this.config.streamStatus;
  }

  getUserTTL(): number {
    return this.config.user;
  }

  getUserStreamsTTL(): number {
    return this.config.userStreams;
  }

  getCategoryStreamsTTL(): number {
    return this.config.categoryStreams;
  }

  getCategoriesTTL(): number {
    return this.config.categories;
  }

  getFollowersTTL(): number {
    return this.config.followers;
  }

  getFollowingTTL(): number {
    return this.config.following;
  }

  getBlockedTTL(): number {
    return this.config.blocked;
  }

  getSearchResultsTTL(): number {
    return this.config.searchResults;
  }

  getRecommendationsTTL(): number {
    return this.config.recommendations;
  }

  // Dynamic TTL based on data freshness
  getDynamicTTL(baseTTL: number, dataAge: number): number {
    // Reduce TTL for older data
    const ageFactor = Math.max(0.1, 1 - (dataAge / (baseTTL * 2)));
    return Math.floor(baseTTL * ageFactor);
  }

  // TTL for frequently accessed data
  getHighFrequencyTTL(baseTTL: number): number {
    return Math.floor(baseTTL * 0.5); // 50% of base TTL
  }

  // TTL for rarely accessed data
  getLowFrequencyTTL(baseTTL: number): number {
    return Math.floor(baseTTL * 2); // 200% of base TTL
  }
}

export const cacheTTLService = CacheTTLService.getInstance();