import { logger } from '@/lib/logger';

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalRequests: number;
  hitRate: number;
  averageResponseTime: number;
  lastUpdated: number;
}

export interface CacheOperation {
  operation: 'get' | 'set' | 'delete' | 'error';
  key: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
}

export class CacheMetricsService {
  private static instance: CacheMetricsService;
  private metrics: CacheMetrics;
  private operations: CacheOperation[] = [];
  private readonly maxOperations = 1000; // Keep last 1000 operations

  private constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0,
      hitRate: 0,
      averageResponseTime: 0,
      lastUpdated: Date.now(),
    };
  }

  static getInstance(): CacheMetricsService {
    if (!CacheMetricsService.instance) {
      CacheMetricsService.instance = new CacheMetricsService();
    }
    return CacheMetricsService.instance;
  }

  recordOperation(operation: CacheOperation): void {
    this.operations.push(operation);
    
    // Keep only recent operations
    if (this.operations.length > this.maxOperations) {
      this.operations = this.operations.slice(-this.maxOperations);
    }

    // Update metrics
    this.updateMetrics(operation);
    
    logger.debug('[CacheMetrics] Operation recorded', {
      operation: operation.operation,
      key: operation.key,
      duration: operation.endTime ? operation.endTime - operation.startTime : 0,
      success: operation.success,
    });
  }

  private updateMetrics(operation: CacheOperation): void {
    this.metrics.totalRequests++;
    
    if (operation.endTime) {
      const duration = operation.endTime - operation.startTime;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + duration) / 
        this.metrics.totalRequests;
    }

    switch (operation.operation) {
      case 'get':
        if (operation.success) {
          this.metrics.hits++;
        } else {
          this.metrics.misses++;
        }
        break;
      case 'set':
        this.metrics.sets++;
        break;
      case 'delete':
        this.metrics.deletes++;
        break;
      case 'error':
        this.metrics.errors++;
        break;
    }

    // Calculate hit rate
    const totalGets = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = totalGets > 0 ? (this.metrics.hits / totalGets) * 100 : 0;
    this.metrics.lastUpdated = Date.now();
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getRecentOperations(limit: number = 50): CacheOperation[] {
    return this.operations.slice(-limit);
  }

  getMetricsByKey(key: string): {
    hits: number;
    misses: number;
    averageResponseTime: number;
  } {
    const keyOperations = this.operations.filter(op => op.key === key);
    const hits = keyOperations.filter(op => op.operation === 'get' && op.success).length;
    const misses = keyOperations.filter(op => op.operation === 'get' && !op.success).length;
    
    const responseTimes = keyOperations
      .filter(op => op.endTime)
      .map(op => op.endTime! - op.startTime);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    return {
      hits,
      misses,
      averageResponseTime,
    };
  }

  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0,
      hitRate: 0,
      averageResponseTime: 0,
      lastUpdated: Date.now(),
    };
    this.operations = [];
    logger.info('[CacheMetrics] Metrics reset');
  }

  logMetrics(): void {
    logger.info('[CacheMetrics] Current metrics', {
      ...this.metrics,
      recentOperations: this.operations.length,
    });
  }
}

export const cacheMetrics = CacheMetricsService.getInstance();