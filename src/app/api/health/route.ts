import { NextRequest, NextResponse } from "next/server";
import { logger, extractRequestContext, generateCorrelationId } from "@/lib/logger";

/**
 * Health Check API Route
 * 
 * Provides system health status for monitoring and load balancers
 * Checks database connectivity, Redis connection, and Inngest status
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  const context = extractRequestContext(request);

  logger.info("Health check requested", { ...context, correlationId });

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    correlationId,
    totalResponseTime: 0,
    services: {
      database: { status: 'unknown', responseTime: 0, error: undefined as string | undefined },
      redis: { status: 'unknown', responseTime: 0, error: undefined as string | undefined },
      inngest: { status: 'unknown', responseTime: 0, error: undefined as string | undefined },
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    try {
      const { db } = await import("@/lib/db");
      await db.$queryRaw`SELECT 1`;
      health.services.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStartTime,
        error: undefined,
      };
    } catch (error) {
      health.services.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStartTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      health.status = 'degraded';
    }

    // Check Redis connectivity
    const redisStartTime = Date.now();
    try {
      const { redisClient } = await import("@/lib/redis");
      await redisClient.ping();
      health.services.redis = {
        status: 'healthy',
        responseTime: Date.now() - redisStartTime,
        error: undefined,
      };
    } catch (error) {
      health.services.redis = {
        status: 'unhealthy',
        responseTime: Date.now() - redisStartTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      health.status = 'degraded';
    }

    // Check Inngest connectivity
    const inngestStartTime = Date.now();
    try {
      await import("@/lib/inngest");
      // Simple check - if we can import inngest, it's likely working
      health.services.inngest = {
        status: 'healthy',
        responseTime: Date.now() - inngestStartTime,
        error: undefined,
      };
    } catch (error) {
      health.services.inngest = {
        status: 'unhealthy',
        responseTime: Date.now() - inngestStartTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      health.status = 'degraded';
    }

    const totalTime = Date.now() - startTime;
    health.totalResponseTime = totalTime;

    logger.info("Health check completed", {
      ...context,
      correlationId,
      duration: totalTime,
      status: health.status,
    });

    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Response-Time': totalTime.toString(),
      },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    logger.error("Health check failed", error as Error, {
      ...context,
      correlationId,
      duration: totalTime,
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalResponseTime: totalTime,
    }, { 
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Response-Time': totalTime.toString(),
      },
    });
  }
}

/**
 * Detailed health check with more information
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  const context = extractRequestContext(request);

  logger.info("Detailed health check requested", { ...context, correlationId });

  const detailedHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    correlationId,
    totalResponseTime: 0,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    },
    services: {
      database: { status: 'unknown', responseTime: 0, details: {} },
      redis: { status: 'unknown', responseTime: 0, details: {} },
      inngest: { status: 'unknown', responseTime: 0, details: {} },
      sse: { status: 'unknown', responseTime: 0, details: {} },
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      version: process.env.npm_package_version,
      buildTime: process.env.BUILD_TIME,
    },
  };

  try {
    // Detailed database check
    const dbStartTime = Date.now();
    try {
      const { db } = await import("@/lib/db");
      const result = await db.$queryRaw`SELECT version() as version, now() as current_time`;
      const [dbInfo] = result as Array<{ version: string; current_time: Date }>;
      detailedHealth.services.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStartTime,
        details: dbInfo,
      };
    } catch (error) {
      detailedHealth.services.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStartTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
      detailedHealth.status = 'degraded';
    }

    // Detailed Redis check
    const redisStartTime = Date.now();
    try {
      const { redisClient } = await import("@/lib/redis");
      const info = await redisClient.info('server');
      detailedHealth.services.redis = {
        status: 'healthy',
        responseTime: Date.now() - redisStartTime,
        details: { info: info.substring(0, 200) + '...' }, // Truncate for brevity
      };
    } catch (error) {
      detailedHealth.services.redis = {
        status: 'unhealthy',
        responseTime: Date.now() - redisStartTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
      detailedHealth.status = 'degraded';
    }

    // SSE connection count
    try {
      const { sseManager } = await import("@/lib/sse");
      detailedHealth.services.sse = {
        status: 'healthy',
        responseTime: 0,
        details: {
          totalConnections: sseManager.getConnectionCount(),
        },
      };
    } catch (error) {
      detailedHealth.services.sse = {
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }

    const totalTime = Date.now() - startTime;
    detailedHealth.totalResponseTime = totalTime;

    logger.info("Detailed health check completed", {
      ...context,
      correlationId,
      duration: totalTime,
      status: detailedHealth.status,
    });

    return NextResponse.json(detailedHealth, { 
      status: detailedHealth.status === 'healthy' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Response-Time': totalTime.toString(),
      },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    logger.error("Detailed health check failed", error as Error, {
      ...context,
      correlationId,
      duration: totalTime,
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalResponseTime: totalTime,
    }, { 
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Response-Time': totalTime.toString(),
      },
    });
  }
}
