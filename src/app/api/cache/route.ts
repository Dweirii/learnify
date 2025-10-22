import { NextRequest, NextResponse } from 'next/server';
import { cacheMetrics } from '@/server/services/cache-metrics.service';
import { cacheWarmingService } from '@/server/services/cache-warming.service';
import { cacheTTLService } from '@/server/services/cache-ttl.service';
import { CacheService } from '@/server/services/cache.service';
import { rateLimitService } from '@/server/services/rate-limit.service';
import { securityHeadersService } from '@/server/services/security-headers.service';
import { validateQuery, validateBody, cacheMetricsSchema, cacheActionSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimitService.checkCacheAPIRateLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { success: false, error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      );
      response.headers.set('Retry-After', rateLimitResult.retryAfter?.toString() || '60');
      return securityHeadersService.applySecurityHeaders(response);
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = validateQuery(cacheMetricsSchema, queryParams);

    let response: NextResponse;

    switch (validatedQuery.action) {
      case 'metrics':
        response = NextResponse.json({
          success: true,
          data: cacheMetrics.getMetrics(),
        });
        break;

      case 'recent-operations':
        response = NextResponse.json({
          success: true,
          data: cacheMetrics.getRecentOperations(validatedQuery.limit),
        });
        break;

      case 'config':
        response = NextResponse.json({
          success: true,
          data: {
            warming: cacheWarmingService.getConfig(),
            ttl: cacheTTLService.getConfig(),
          },
        });
        break;

      default:
        response = NextResponse.json({
          success: true,
          data: {
            metrics: cacheMetrics.getMetrics(),
            warming: cacheWarmingService.getConfig(),
            ttl: cacheTTLService.getConfig(),
          },
        });
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '60');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    return securityHeadersService.applySecurityHeaders(response);
  } catch (error) {
    logger.error('[CacheAPI] Error in GET request:', error as Error);
    const response = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
    return securityHeadersService.applySecurityHeaders(response);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimitService.checkCacheAPIRateLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { success: false, error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      );
      response.headers.set('Retry-After', rateLimitResult.retryAfter?.toString() || '60');
      return securityHeadersService.applySecurityHeaders(response);
    }

    // Validate request body
    const body = await request.json();
    const validatedBody = validateBody(cacheActionSchema, body);

    let response: NextResponse;

    switch (validatedBody.action) {
      case 'reset-metrics':
        cacheMetrics.resetMetrics();
        response = NextResponse.json({
          success: true,
          message: 'Metrics reset successfully',
        });
        break;

      case 'warm-cache':
        await cacheWarmingService.warmCache();
        response = NextResponse.json({
          success: true,
          message: 'Cache warming initiated',
        });
        break;

      case 'update-warming-config':
        cacheWarmingService.updateConfig(validatedBody.data || {});
        response = NextResponse.json({
          success: true,
          message: 'Warming configuration updated',
        });
        break;

      case 'update-ttl-config':
        cacheTTLService.updateConfig(validatedBody.data || {});
        response = NextResponse.json({
          success: true,
          message: 'TTL configuration updated',
        });
        break;

      case 'clear-cache':
        const pattern = (validatedBody.data as any)?.pattern || '*';
        await CacheService.clearPattern(pattern);
        response = NextResponse.json({
          success: true,
          message: `Cache cleared for pattern: ${pattern}`,
        });
        break;

      default:
        response = NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '60');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    return securityHeadersService.applySecurityHeaders(response);
  } catch (error) {
    logger.error('[CacheAPI] Error in POST request:', error as Error);
    const response = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
    return securityHeadersService.applySecurityHeaders(response);
  }
}