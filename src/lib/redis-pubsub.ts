import Redis from 'ioredis';
import { logger } from './logger';

export interface PubSubEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  serverId: string;
}

export class RedisPubSubManager {
  private publisher: Redis;
  private subscriber: Redis;
  private serverId: string;
  private subscriptions: Map<string, (event: PubSubEvent) => void> = new Map();
  
  constructor() {
    this.serverId = process.env.SERVER_ID || `server-${Date.now()}`;
    
    // Initialize publisher connection
    this.publisher = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 2,
      connectTimeout: 15000,
      commandTimeout: 8000,
      family: 4,
      db: 0,
    });

    // Initialize subscriber connection
    this.subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 2,
      connectTimeout: 15000,
      commandTimeout: 8000,
      family: 4,
      db: 0,
    });

    // Setup error handling
    this.publisher.on('error', (err) => {
      logger.error('[RedisPubSub] Publisher error:', err);
    });

    this.subscriber.on('error', (err) => {
      logger.error('[RedisPubSub] Subscriber error:', err);
    });

    // Setup connection events
    this.publisher.on('connect', () => {
      logger.info('[RedisPubSub] Publisher connected');
    });

    this.subscriber.on('connect', () => {
      logger.info('[RedisPubSub] Subscriber connected');
    });

    logger.info(`[RedisPubSub] Initialized with server ID: ${this.serverId}`);
  }
  
  async publish(channel: string, event: Record<string, unknown>): Promise<void> {
    try {
      const pubSubEvent: PubSubEvent = {
        type: event.type as string,
        data: event.data as Record<string, unknown>,
        timestamp: Date.now(),
        serverId: this.serverId,
      };

      await this.publisher.publish(channel, JSON.stringify(pubSubEvent));
              // Reduced logging for performance
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to publish to ${channel}:`, error as Error);
      throw error;
    }
  }
  
  async subscribe(channel: string, callback: (event: PubSubEvent) => void): Promise<void> {
    try {
      // Store callback for cleanup
      this.subscriptions.set(channel, callback);
      
      // Subscribe to channel
      await this.subscriber.subscribe(channel);
      
      // Setup message handler
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const event: PubSubEvent = JSON.parse(message);
            
            // Don't process events from our own server
            if (event.serverId === this.serverId) {
              return;
            }
            
                    // Reduced logging for performance
            callback(event);
          } catch (error) {
            logger.error(`[RedisPubSub] Failed to parse message from ${channel}:`, error as Error);
          }
        }
      });
      
      logger.info(`[RedisPubSub] Subscribed to channel: ${channel}`);
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to subscribe to ${channel}:`, error as Error);
      throw error;
    }
  }
  
  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
      this.subscriptions.delete(channel);
      logger.info(`[RedisPubSub] Unsubscribed from channel: ${channel}`);
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to unsubscribe from ${channel}:`, error as Error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.publisher.disconnect(),
        this.subscriber.disconnect(),
      ]);
      this.subscriptions.clear();
      logger.info('[RedisPubSub] Disconnected from Redis');
    } catch (error) {
      logger.error('[RedisPubSub] Error during disconnect:', error as Error);
    }
  }

  // Helper method to get channel names
  static getChannelName(type: 'streams' | 'stream', streamId?: string): string {
    if (type === 'streams') {
      return 'learnify:streams';
    }
    if (type === 'stream' && streamId) {
      return `learnify:stream:${streamId}`;
    }
    throw new Error('Invalid channel type or missing streamId');
  }
}

export const redisPubSub = new RedisPubSubManager();