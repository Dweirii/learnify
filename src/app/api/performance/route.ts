import { NextResponse } from "next/server";
import { CacheService } from "@/server/services/cache.service";
import { logger } from "@/lib/logger";

/**
 * Performance Monitoring API Route
 * 
 * Provides performance metrics for monitoring and optimization
 * - Cache hit rates
 * - Database query performance
 * - Memory usage
 * - Response times
 */

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Get cache performance stats
    const cacheStats = await CacheService.getCachePerformanceStats();
    
    // Get system performance metrics
    const systemMetrics = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
    };
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    const performanceData = {
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      cache: cacheStats,
      system: systemMetrics,
      environment: process.env.NODE_ENV,
    };
    
    logger.info("Performance metrics requested", { 
      responseTime,
      cacheHitRate: cacheStats.hitRate,
      memoryUsage: `${Math.round(systemMetrics.memory.heapUsed / 1024 / 1024)}MB`
    });
    
    return NextResponse.json(performanceData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    logger.error("Failed to get performance metrics", error as Error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get performance metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
