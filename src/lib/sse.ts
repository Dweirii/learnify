import { EventEmitter } from "events";
import { logger } from './logger';

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
 * SSE Connection Manager
 */
class SSEConnectionManager {
  private connections = new Map<string, {
    streamId: string;
    response: ReadableStreamDefaultController;
    lastPing: number;
  }>();

  addConnection(connectionId: string, streamId: string, controller: ReadableStreamDefaultController) {
    this.connections.set(connectionId, {
      streamId,
      response: controller,
      lastPing: Date.now(),
    });
    
    logger.info(`[SSE] Connection ${connectionId} added for stream ${streamId}`);
    logger.info(`[SSE] Total connections: ${this.connections.size}`);
  }

  removeConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      logger.info(`[SSE] Connection ${connectionId} removed`);
      logger.info(`[SSE] Total connections: ${this.connections.size}`);
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

  sendToAll(event: StreamEvent) {
    let sentCount = 0;
    
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
    
    logger.info(`[SSE] Event sent to ${sentCount} total connections`);
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
}

export const sseManager = new SSEConnectionManager();

/**
 * SSE Event Publisher
 * 
 * Publishes events to SSE clients
 */
export class SSEEventPublisher {
  static publishStreamStarted(streamId: string, userId: string, data: unknown) {
    const event: StreamEvent = {
      type: 'stream.started',
      streamId,
      userId,
      data,
      timestamp: new Date().toISOString(),
    };

    logger.info(`[SSE] Publishing stream.started event for stream ${streamId}`);
    sseManager.sendToStream(streamId, event);
    sseEmitter.emit('stream.started', event);
  }

  static publishStreamEnded(streamId: string, userId: string, data: unknown) {
    const event: StreamEvent = {
      type: 'stream.ended',
      streamId,
      userId,
      data,
      timestamp: new Date().toISOString(),
    };

    logger.info(`[SSE] Publishing stream.ended event for stream ${streamId}`);
    sseManager.sendToStream(streamId, event);
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
    }, 30000); // Send heartbeat every 30 seconds
    
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
