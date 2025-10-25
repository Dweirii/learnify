import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface SecurityHeadersConfig {
  contentSecurityPolicy: string;
  xFrameOptions: 'DENY' | 'SAMEORIGIN';
  xContentTypeOptions: 'nosniff';
  referrerPolicy: 'strict-origin-when-cross-origin' | 'no-referrer';
  permissionsPolicy: string;
  strictTransportSecurity?: string;
  xXssProtection?: string;
}

export class SecurityHeadersService {
  private static instance: SecurityHeadersService;
  private config: SecurityHeadersConfig;

  private constructor() {
    this.config = {
      contentSecurityPolicy: this.buildCSP(),
      xFrameOptions: 'SAMEORIGIN',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: this.buildPermissionsPolicy(),
      strictTransportSecurity: 'max-age=31536000; includeSubDomains',
      xXssProtection: '1; mode=block',
    };
  }

  static getInstance(): SecurityHeadersService {
    if (!SecurityHeadersService.instance) {
      SecurityHeadersService.instance = new SecurityHeadersService();
    }
    return SecurityHeadersService.instance;
  }

  private buildCSP(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const directives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${isProduction ? '' : 'localhost:*'}`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: https:`,
      `font-src 'self' data:`,
      `connect-src 'self' ${baseUrl} wss: https:`,
      `media-src 'self' blob:`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'self'`,
      `upgrade-insecure-requests`,
    ];

    return directives.join('; ');
  }

  private buildPermissionsPolicy(): string {
    const policies = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'speaker=()',
      'vibrate=()',
      'fullscreen=(self)',
      'sync-xhr=()',
    ];

    return policies.join(', ');
  }

  applySecurityHeaders(response: NextResponse): NextResponse {
    try {
      // Content Security Policy
      response.headers.set('Content-Security-Policy', this.config.contentSecurityPolicy);
      
      // Frame Options
      response.headers.set('X-Frame-Options', this.config.xFrameOptions);
      
      // Content Type Options
      response.headers.set('X-Content-Type-Options', this.config.xContentTypeOptions);
      
      // Referrer Policy
      response.headers.set('Referrer-Policy', this.config.referrerPolicy);
      
      // Permissions Policy
      response.headers.set('Permissions-Policy', this.config.permissionsPolicy);
      
      // Strict Transport Security (HTTPS only)
      if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', this.config.strictTransportSecurity!);
      }
      
      // XSS Protection
      response.headers.set('X-XSS-Protection', this.config.xXssProtection!);
      
      // Additional security headers
      response.headers.set('X-DNS-Prefetch-Control', 'off');
      response.headers.set('X-Download-Options', 'noopen');
      response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
      
      logger.debug('[SecurityHeaders] Security headers applied');
      
      return response;
    } catch (error) {
      logger.error('[SecurityHeaders] Error applying security headers', error as Error);
      return response;
    }
  }

  // Middleware function for Next.js
  middleware(): NextResponse {
    const response = NextResponse.next();
    return this.applySecurityHeaders(response);
  }

  // API route wrapper
  async withSecurityHeaders<T>(
    handler: (req: NextRequest) => Promise<NextResponse<T>>
  ): Promise<(req: NextRequest) => Promise<NextResponse<T>>> {
    return async (req: NextRequest): Promise<NextResponse<T>> => {
      try {
        const response = await handler(req);
        return this.applySecurityHeaders(response) as NextResponse<T>;
      } catch (error) {
        logger.error('[SecurityHeaders] Error in API handler', error as Error);
        const errorResponse = NextResponse.json(
          { success: false, error: 'Internal server error' },
          { status: 500 }
        );
        return this.applySecurityHeaders(errorResponse) as NextResponse<T>;
      }
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('[SecurityHeaders] Configuration updated', { config: this.config });
  }

  // Get current configuration
  getConfig(): SecurityHeadersConfig {
    return { ...this.config };
  }

  // Validate headers for a specific route
  validateHeadersForRoute(route: string): SecurityHeadersConfig {
    const routeConfig = { ...this.config };
    
    // Customize headers based on route
    switch (route) {
      case '/api/stream':
        // Allow more permissive CSP for streaming
        routeConfig.contentSecurityPolicy = routeConfig.contentSecurityPolicy
          .replace('media-src \'self\' blob:', 'media-src \'self\' blob: https: wss:');
        break;
        
      case '/api/upload':
        // Allow file uploads
        routeConfig.contentSecurityPolicy = routeConfig.contentSecurityPolicy
          .replace('form-action \'self\'', 'form-action \'self\' https:');
        break;
        
      default:
        // Use default configuration
        break;
    }
    
    return routeConfig;
  }

  // Generate security report
  generateSecurityReport(): {
    headers: SecurityHeadersConfig;
    recommendations: string[];
    score: number;
  } {
    const recommendations: string[] = [];
    let score = 100;

    // Check CSP
    if (!this.config.contentSecurityPolicy.includes('default-src')) {
      recommendations.push('Add default-src directive to CSP');
      score -= 10;
    }

    // Check frame options
    if (this.config.xFrameOptions === 'SAMEORIGIN') {
      recommendations.push('Consider using DENY for X-Frame-Options for better security');
      score -= 5;
    }

    // Check HSTS
    if (!this.config.strictTransportSecurity && process.env.NODE_ENV === 'production') {
      recommendations.push('Enable Strict-Transport-Security for production');
      score -= 15;
    }

    // Check referrer policy
    if (this.config.referrerPolicy !== 'no-referrer') {
      recommendations.push('Consider using no-referrer for maximum privacy');
      score -= 5;
    }

    return {
      headers: this.config,
      recommendations,
      score: Math.max(0, score),
    };
  }
}

export const securityHeadersService = SecurityHeadersService.getInstance();
