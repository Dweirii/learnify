import { EventEmitter } from "events";
import { logger } from './logger';
import { redisPubSub, RedisPubSubManager, PubSubEvent } from './redis-pubsub';

/**
 * Server-Sent Events Manager
 * 
 * Handles real-time event streaming to connected clients
 * Uses EventEmitter for in-memory event distribution
 */

class SSEEventEmitter extends EventEmitter {
  private static instance: SSEEventEmitter;
  
  static getInstance(): SSEEventEmitter {
    if (!SSEEventEmitter.instance) {
      SSEEventEmitter.instance = new SSEEventEmitter();
    }
    return SSEEventEmitter.instance;
  }
  
  constructor() {
    super();
    this.setMaxListeners(1000); // Allow many concurrent connections
  }
}

export const sseEmitter = SSEEventEmitter.getInstance();

/**
 * Stream Event Types
 */
export interface StreamEvent {
  type: 'stream.started' | 'stream.ended' | 'viewer.joined' | 'viewer.left' | 'viewer.count.updated';
  streamId: string;
  userId: string;
  data: unknown;
  timestamp: string;
}

/**
 * Connection Types
 */
type ConnectionType = 'stream-specific' | 'stream-list' | 'all';

interface ConnectionInfo {
  streamId: string;
  type: ConnectionType;
  category?: string;
  response: ReadableStreamDefaultController;
  lastPing: number;
}

/**
 * SSE Connection Manager
 */
class SSEConnectionManager {
  private connections = new Map<string, ConnectionInfo>();
  private redisInitialized = false;

  constructor() {
    this.initializeRedisSubscriptions();
  }

  private async initializeRedisSubscriptions() {
    if (this.redisInitialized) return;
    
    try {
      // Subscribe to global streams channel for cross-server events
      await redisPubSub.subscribe(
        RedisPubSubManager.getChannelName('streams'),
        (event: PubSubEvent) => {
          this.handleRedisEvent(event);
        }
      );
      
      this.redisInitialized = true;
      logger.info('[SSE] Redis Pub/Sub subscriptions initialized');
    } catch (error) {
      logger.error('[SSE] Failed to initialize Redis subscriptions:', error as Error);
    }
  }

  private handleRedisEvent(event: PubSubEvent) {
    try {
      // Convert Redis event to SSE event
      const sseEvent: StreamEvent = {
        type: event.type as any,
        streamId: event.data.streamId || event.data.id,
        userId: event.data.userId,
        data: event.data,
        timestamp: new Date(event.timestamp).toISOString(),
      };

      // Reduced logging for performance - only log errors

      // Forward to appropriate SSE connections
      switch (event.type) {
        case 'stream.started':
        case 'stream.ended':
          // Send to stream-list subscribers
          this.sendToStreamList(sseEvent, event.data.category);
          break;
        case 'viewer.joined':
        case 'viewer.left':
        case 'viewer.count.updated':
          // Send to specific stream viewers
          this.sendToStream(sseEvent.streamId, sseEvent);
          break;
        default:
          // Reduced logging for performance
      }
    } catch (error) {
      logger.error('[SSE] Failed to handle Redis event:', error as Error);
    }
  }

  addConnection(
    connectionId: string,
    streamId: string,
    controller: ReadableStreamDefaultController,
    type: ConnectionType = 'stream-specific',
    category?: string
  ) {
    this.connections.set(connectionId, {
      streamId,
      type,
      category,
      response: controller,
      lastPing: Date.now(),
    });
    
    logger.info(`[SSE] Connection ${connectionId} added`, { 
      type, 
      streamId, 
      category,
      totalConnections: this.connections.size 
    });
  }

  removeConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      logger.info(`[SSE] Connection ${connectionId} removed`, {
        totalConnections: this.connections.size
      });
    }
  }

  sendToStream(streamId: string, event: StreamEvent) {
    let sentCount = 0;
    
    for (const [connectionId, connection] of this.connections) {
      if (connection.streamId === streamId) {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          connection.response.enqueue(new TextEncoder().encode(data));
          sentCount++;
        } catch (error) {
          logger.error(`[SSE] Failed to send to connection ${connectionId}`, error as Error);
          this.removeConnection(connectionId);
        }
      }
    }
    
    logger.info(`[SSE] Event sent to ${sentCount} connections for stream ${streamId}`);
  }

  async sendToAll(event: StreamEvent) {
    let sentCount = 0;
    
    // Send to local SSE connections
    for (const [connectionId, connection] of this.connections) {
      try {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        connection.response.enqueue(new TextEncoder().encode(data));
        sentCount++;
      } catch (error) {
        logger.error(`[SSE] Failed to send to connection ${connectionId}`, error as Error);
        this.removeConnection(connectionId);
      }
    }
    
            // 🚀 NEW: Publish to Redis for other servers
            try {
              await redisPubSub.publish(
                RedisPubSubManager.getChannelName('streams'),
                event
              );
              // Reduced logging for performance
            } catch (error) {
              logger.error(`[SSE] Failed to publish to Redis:`, error as Error);
            }
    
    // Reduced logging for performance - only log if no connections
    if (sentCount === 0) {
      logger.debug(`[SSE] Event sent to ${sentCount} local connections and published to Redis`);
    }
  }

  /**
   * 🚀 NEW: Send to stream-list subscribers
   */
  async sendToStreamList(event: StreamEvent, category?: string) {
    let sentCount = 0;
    
    // Send to local stream-list connections
    for (const [connectionId, connection] of this.connections) {
      // Only send to stream-list type connections
      if (connection.type === 'stream-list') {
        // If category filter is specified, check it matches
        if (category && connection.category && connection.category !== category) {
          continue;
        }
        
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          connection.response.enqueue(new TextEncoder().encode(data));
          sentCount++;
        } catch (error) {
          logger.error(`[SSE] Failed to send to connection ${connectionId}`, error as Error);
          this.removeConnection(connectionId);
        }
      }
    }
    
            // 🚀 NEW: Publish to Redis for other servers (only for stream events)
            if (event.type === 'stream.started' || event.type === 'stream.ended') {
              try {
                await redisPubSub.publish(
                  RedisPubSubManager.getChannelName('streams'),
                  event
                );
                // Reduced logging for performance
              } catch (error) {
                logger.error(`[SSE] Failed to publish stream list event to Redis:`, error as Error);
              }
            }
    
    // Reduced logging for performance - only log if no connections
    if (sentCount === 0) {
      logger.debug(`[SSE] Stream list event sent to ${sentCount} local connections and published to Redis`, { category });
    }
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getStreamConnectionCount(streamId: string): number {
    let count = 0;
    for (const connection of this.connections.values()) {
      if (connection.streamId === streamId) {
        count++;
      }
    }
    return count;
  }

  /**
   * 🚀 NEW: Get stream-list connection count
   */
  getStreamListConnectionCount(category?: string): number {
    let count = 0;
    for (const connection of this.connections.values()) {
      if (connection.type === 'stream-list') {
        if (!category || connection.category === category) {
          count++;
        }
      }
    }
    return count;
  }
}

export const sseManager = new SSEConnectionManager();

/**
 * SSE Event Publisher
 * 
 * Publishes events to SSE clients
 */
export class SSEEventPublisher {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async publishStreamStarted(streamId: string, userId: string, data: any) {
    const event: StreamEvent = {
      type: 'stream.started',
      streamId,
      userId,
      data,
      timestamp: new Date().toISOString(),
    };

    logger.info(`[SSE] Publishing stream.started event for stream ${streamId}`);
    
    // Send to specific stream viewers
    sseManager.sendToStream(streamId, event);
    
    // NEW: Send to stream-list subscribers (now async)
    await sseManager.sendToStreamList(event, data.category);
    
    // Emit to event emitter
    sseEmitter.emit('stream.started', event);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async publishStreamEnded(streamId: string, userId: string, data: any) {
    const event: StreamEvent = {
      type: 'stream.ended',
      streamId,
      userId,
      data,
      timestamp: new Date().toISOString(),
    };

    logger.info(`[SSE] Publishing stream.ended event for stream ${streamId}`, { 
      streamId, 
      userId, 
      data,
      eventType: event.type 
    });
    
    // Send to specific stream viewers
    sseManager.sendToStream(streamId, event);
    
    // 🚀 NEW: Send to stream-list subscribers (now async)
    await sseManager.sendToStreamList(event, data.category);
    
    // Emit to event emitter
    sseEmitter.emit('stream.ended', event);
  }

  static publishViewerJoined(streamId: string, userId: string, viewerCount: number) {
    const event: StreamEvent = {
      type: 'viewer.joined',
      streamId,
      userId,
      data: { viewerCount },
      timestamp: new Date().toISOString(),
    };

    logger.info(`[SSE] Publishing viewer.joined event for stream ${streamId} (count: ${viewerCount})`);
    sseManager.sendToStream(streamId, event);
    sseEmitter.emit('viewer.joined', event);
  }

  static publishViewerLeft(streamId: string, userId: string, viewerCount: number) {
    const event: StreamEvent = {
      type: 'viewer.left',
      streamId,
      userId,
      data: { viewerCount },
      timestamp: new Date().toISOString(),
    };

    logger.info(`[SSE] Publishing viewer.left event for stream ${streamId} (count: ${viewerCount})`);
    sseManager.sendToStream(streamId, event);
    sseEmitter.emit('viewer.left', event);
  }

  static publishViewerCountUpdate(streamId: string, userId: string, viewerCount: number) {
    const event: StreamEvent = {
      type: 'viewer.count.updated',
      streamId,
      userId,
      data: { viewerCount },
      timestamp: new Date().toISOString(),
    };

    logger.info(`[SSE] Publishing viewer.count.updated event for stream ${streamId} (count: ${viewerCount})`);
    sseManager.sendToStream(streamId, event);
    sseEmitter.emit('viewer.count.updated', event);
  }
}

/**
 * Heartbeat Manager
 * 
 * Sends periodic ping messages to keep connections alive
 */
class HeartbeatManager {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.sendHeartbeat();
    }, 120000); // Send heartbeat every 2 minutes (reduced to prevent rate limiting)
    
    logger.info("[SSE] Heartbeat manager started");
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info("[SSE] Heartbeat manager stopped");
  }

  private sendHeartbeat() {
    const heartbeatData = `data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`;
    
    for (const [connectionId, connection] of sseManager['connections']) {
      try {
        connection.response.enqueue(new TextEncoder().encode(heartbeatData));
      } catch (error) {
        logger.error(`[SSE] Failed to send heartbeat to connection ${connectionId}`, error as Error);
        sseManager.removeConnection(connectionId);
      }
    }
  }
}

export const heartbeatManager = new HeartbeatManager();

// Start heartbeat manager
heartbeatManager.start();