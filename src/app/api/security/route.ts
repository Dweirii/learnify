import { NextRequest, NextResponse } from 'next/server';
import { rateLimitService } from '@/server/services/rate-limit.service';
import { securityHeadersService } from '@/server/services/security-headers.service';
import { streamKeyEncryptionService } from '@/server/services/stream-key-encryption.service';
import { validateQuery, validateBody, z } from '@/lib/validations';
import { logger } from '@/lib/logger';

const securityAuditSchema = z.object({
  action: z.enum(['audit', 'generate-key', 'validate-key', 'refresh-key', 'revoke-key']),
});

const streamKeySchema = z.object({
  action: z.enum(['generate', 'validate', 'refresh', 'revoke']),
  streamId: z.string().min(1),
  userId: z.string().min(1).optional(),
  key: z.string().min(1).optional(),
  permissions: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimitService.checkAPIRateLimit(clientIP);
    
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
    const validatedQuery = validateQuery(securityAuditSchema, queryParams);

    let response: NextResponse;

    switch (validatedQuery.action) {
      case 'audit':
        const securityReport = securityHeadersService.generateSecurityReport();
        const encryptionAudit = await streamKeyEncryptionService.performSecurityAudit();
        const rateLimitConfigs = rateLimitService.getAllConfigs();
        
        response = NextResponse.json({
          success: true,
          data: {
            securityHeaders: securityReport,
            streamKeyEncryption: encryptionAudit,
            rateLimiting: {
              configs: Object.fromEntries(rateLimitConfigs),
              totalConfigs: rateLimitConfigs.size,
            },
            overallScore: Math.round((securityReport.score + encryptionAudit.score) / 2),
            recommendations: [
              ...securityReport.recommendations,
              ...encryptionAudit.recommendations,
            ],
          },
        });
        break;

      default:
        response = NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '1000');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    return securityHeadersService.applySecurityHeaders(response);
  } catch (error) {
    logger.error('[SecurityAPI] Error in GET request:', error as Error);
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
    const rateLimitResult = await rateLimitService.checkAPIRateLimit(clientIP);
    
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
    const validatedBody = validateBody(streamKeySchema, body);

    let response: NextResponse;

    switch (validatedBody.action) {
      case 'generate':
        if (!validatedBody.streamId || !validatedBody.userId) {
          response = NextResponse.json(
            { success: false, error: 'streamId and userId are required' },
            { status: 400 }
          );
          break;
        }
        
        const key = await streamKeyEncryptionService.generateStreamKey(
          validatedBody.streamId,
          validatedBody.userId,
          validatedBody.permissions || ['view']
        );
        
        response = NextResponse.json({
          success: true,
          data: { key },
          message: 'Stream key generated successfully',
        });
        break;

      case 'validate':
        if (!validatedBody.streamId || !validatedBody.key) {
          response = NextResponse.json(
            { success: false, error: 'streamId and key are required' },
            { status: 400 }
          );
          break;
        }
        
        const keyData = await streamKeyEncryptionService.validateStreamKey(
          validatedBody.key,
          validatedBody.streamId
        );
        
        if (!keyData) {
          response = NextResponse.json(
            { success: false, error: 'Invalid or expired stream key' },
            { status: 401 }
          );
        } else {
          response = NextResponse.json({
            success: true,
            data: keyData,
            message: 'Stream key is valid',
          });
        }
        break;

      case 'refresh':
        if (!validatedBody.streamId || !validatedBody.key) {
          response = NextResponse.json(
            { success: false, error: 'streamId and key are required' },
            { status: 400 }
          );
          break;
        }
        
        const newKey = await streamKeyEncryptionService.refreshStreamKey(
          validatedBody.key,
          validatedBody.streamId
        );
        
        response = NextResponse.json({
          success: true,
          data: { key: newKey },
          message: 'Stream key refreshed successfully',
        });
        break;

      case 'revoke':
        if (!validatedBody.streamId || !validatedBody.key) {
          response = NextResponse.json(
            { success: false, error: 'streamId and key are required' },
            { status: 400 }
          );
          break;
        }
        
        const revoked = await streamKeyEncryptionService.revokeStreamKey(
          validatedBody.key,
          validatedBody.streamId
        );
        
        if (!revoked) {
          response = NextResponse.json(
            { success: false, error: 'Failed to revoke stream key' },
            { status: 400 }
          );
        } else {
          response = NextResponse.json({
            success: true,
            message: 'Stream key revoked successfully',
          });
        }
        break;

      default:
        response = NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '1000');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    return securityHeadersService.applySecurityHeaders(response);
  } catch (error) {
    logger.error('[SecurityAPI] Error in POST request:', error as Error);
    const response = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
    return securityHeadersService.applySecurityHeaders(response);
  }
}
