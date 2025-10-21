/**
 * Structured Logging Utility
 * 
 * Features:
 * - Structured JSON logging for production
 * - Correlation IDs for request tracing
 * - Performance timing
 * - Error context capture
 * - Development vs production formatting
 */

export interface LogContext {
  correlationId?: string;
  userId?: string;
  streamId?: string;
  requestId?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatLog(level: string, message: string, context?: LogContext, error?: Error): string {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level as LogEntry['level'],
      message,
      context,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (this.isDevelopment) {
      // Pretty format for development
      const emojiMap: Record<string, string> = {
        debug: '🐛',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      };
      const emoji = emojiMap[level] || '📝';

      return `${emoji} [${level.toUpperCase()}] ${message}${context ? ` | ${JSON.stringify(context)}` : ''}${error ? ` | Error: ${error.message}` : ''}`;
    }

    // Structured JSON for production
    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatLog('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext) {
    console.error(this.formatLog('error', message, context, error));
  }

  // Specialized logging methods
  webhook(event: string, context?: LogContext) {
    this.info(`Webhook received: ${event}`, {
      ...context,
      event,
      source: 'webhook',
    });
  }

  inngest(functionName: string, event: string, context?: LogContext) {
    this.info(`Inngest function executed: ${functionName}`, {
      ...context,
      function: functionName,
      event,
      source: 'inngest',
    });
  }

  database(operation: string, table: string, context?: LogContext) {
    this.info(`Database operation: ${operation}`, {
      ...context,
      operation,
      table,
      source: 'database',
    });
  }

  sse(event: string, context?: LogContext) {
    this.info(`SSE event: ${event}`, {
      ...context,
      event,
      source: 'sse',
    });
  }

  performance(operation: string, duration: number, context?: LogContext) {
    this.info(`Performance: ${operation}`, {
      ...context,
      operation,
      duration,
      source: 'performance',
    });
  }

  // Request logging with correlation ID
  request(method: string, url: string, statusCode: number, duration: number, context?: LogContext) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this[level](`${method} ${url}`, {
      ...context,
      method,
      url,
      statusCode,
      duration,
      source: 'request',
    });
  }
}

export const logger = new Logger();

/**
 * Performance Timer Utility
 */
export class PerformanceTimer {
  private startTime: number;
  private operation: string;
  private context?: LogContext;

  constructor(operation: string, context?: LogContext) {
    this.operation = operation;
    this.context = context;
    this.startTime = Date.now();
  }

  end(): number {
    const duration = Date.now() - this.startTime;
    logger.performance(this.operation, duration, this.context);
    return duration;
  }

  // Static method for quick timing
  static async time<T>(operation: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const timer = new PerformanceTimer(operation, context);
    try {
      const result = await fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  }

  static timeSync<T>(operation: string, fn: () => T, context?: LogContext): T {
    const timer = new PerformanceTimer(operation, context);
    try {
      const result = fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  }
}

/**
 * Correlation ID Generator
 */
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Request Context Extractor
 */
export function extractRequestContext(request: Request): LogContext {
  const url = new URL(request.url);
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  
  return {
    correlationId,
    method: request.method,
    url: url.pathname,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
  };
}

/**
 * Error Context Builder
 */
export function buildErrorContext(error: Error, context?: LogContext): LogContext {
  return {
    ...context,
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
  };
}
