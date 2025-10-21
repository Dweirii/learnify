import { useEffect, useState, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";

/**
 * Stream Event Types
 */
export interface StreamEvent {
  type: 'stream.started' | 'stream.ended' | 'viewer.joined' | 'viewer.left' | 'viewer.count.updated' | 'connection.established' | 'connection.stats' | 'ping';
  streamId: string;
  userId: string;
  data: unknown;
  timestamp: string;
}

export interface ConnectionStats {
  totalConnections: number;
  streamConnections: number;
}

export interface UseStreamUpdatesOptions {
  streamId?: string;
  userId?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface UseStreamUpdatesReturn {
  isConnected: boolean;
  connectionStats: ConnectionStats | null;
  lastEvent: StreamEvent | null;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * React Hook for Real-time Stream Updates via Server-Sent Events
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Event filtering by stream ID
 * - Error handling and recovery
 * - Memory-safe cleanup
 * 
 * @param options Configuration options
 * @returns Stream update state and controls
 */
export function useStreamUpdates(options: UseStreamUpdatesOptions = {}): UseStreamUpdatesReturn {
  const {
    streamId,
    userId,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  const [lastEvent, setLastEvent] = useState<StreamEvent | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs for cleanup and reconnection
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  // Build SSE URL
  const buildSSEUrl = useCallback(() => {
    const url = new URL('/api/stream-updates', window.location.origin);
    if (streamId) url.searchParams.set('streamId', streamId);
    if (userId) url.searchParams.set('userId', userId);
    return url.toString();
  }, [streamId, userId]);

  // Handle incoming events
  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      // Skip empty or invalid events
      if (!event.data || event.data.trim() === '') {
        return;
      }

      const data: StreamEvent = JSON.parse(event.data);
      
      // Validate event structure
      if (!data || typeof data !== 'object' || !data.type) {
        logger.warn('[useStreamUpdates] Invalid event structure', { data });
        return;
      }
      
      logger.info(`[useStreamUpdates] Received event: ${data.type}`, { event: data });

      // Update last event
      setLastEvent(data);

      // Handle connection events
      if (data.type === 'connection.established') {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
        logger.info(`[useStreamUpdates] Connection established: ${(data.data as { connectionId?: string })?.connectionId}`);
      }

      if (data.type === 'connection.stats') {
        // Safely access nested data with fallbacks
        const stats = (data.data as { totalConnections?: number; streamConnections?: number }) || {};
        setConnectionStats({
          totalConnections: stats.totalConnections || 0,
          streamConnections: stats.streamConnections || 0,
        });
      }

      // Handle ping events (heartbeat)
      if (data.type === 'ping') {
        logger.debug(`[useStreamUpdates] Received ping at ${data.timestamp}`);
      }

    } catch (err) {
      logger.error('[useStreamUpdates] Failed to parse event', err as Error);
      setError(new Error('Failed to parse event data'));
    }
  }, [onConnect]);

  // Handle connection open
  const handleOpen = useCallback(() => {
    logger.info('[useStreamUpdates] SSE connection opened');
    setIsConnected(true);
    setError(null);
    reconnectAttemptsRef.current = 0;
    onConnect?.();
  }, [onConnect]);

  // Handle connection errors
  const handleError = useCallback((): void => {
    logger.error('[useStreamUpdates] SSE connection error', new Error('SSE connection error'));
    
    const error = new Error('SSE connection error');
    setError(error);
    setIsConnected(false);
    
    onError?.(error);

    // Attempt reconnection if enabled
    if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
      const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current);
      logger.info(`[useStreamUpdates] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          reconnectAttemptsRef.current++;
          // Use a timeout to break the circular dependency
          setTimeout(() => connect(), 0);
        }
      }, delay);
    }
  }, [autoReconnect, reconnectInterval, maxReconnectAttempts, onError]);

  // Connect to SSE
  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = buildSSEUrl();
    logger.info(`[useStreamUpdates] Connecting to SSE: ${url}`);

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = handleOpen;
      eventSource.onmessage = handleEvent;
      eventSource.onerror = handleError;

    } catch (err) {
      logger.error('[useStreamUpdates] Failed to create EventSource', err as Error);
      setError(new Error('Failed to create SSE connection'));
    }
  }, [buildSSEUrl, handleOpen, handleEvent, handleError]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    logger.info('[useStreamUpdates] Disconnecting from SSE');
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    logger.info('[useStreamUpdates] Manual reconnect requested');
    reconnectAttemptsRef.current = 0;
    disconnect();
    
    // Small delay before reconnecting
    setTimeout(() => {
      if (isMountedRef.current) {
        connect();
      }
    }, 100);
  }, [disconnect, connect]);

  // Initialize connection on mount
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect when streamId or userId changes
  useEffect(() => {
    if (isMountedRef.current && isConnected) {
      logger.info('[useStreamUpdates] Stream ID or User ID changed, reconnecting...');
      reconnect();
    }
  }, [streamId, userId, reconnect, isConnected]);

  return {
    isConnected,
    connectionStats,
    lastEvent,
    error,
    reconnect,
    disconnect,
  };
}

/**
 * Hook for subscribing to specific stream events
 */
export function useStreamEvent(
  streamId: string,
  eventType: StreamEvent['type'],
  callback: (event: StreamEvent) => void,
  options: Omit<UseStreamUpdatesOptions, 'streamId'> = {}
) {
  const { lastEvent } = useStreamUpdates({ ...options, streamId });

  useEffect(() => {
    if (lastEvent && lastEvent.type === eventType) {
      callback(lastEvent);
    }
  }, [lastEvent, eventType, callback]);
}

/**
 * Hook for real-time viewer count updates with connection stability
 */
export function useViewerCount(streamId: string, initialCount: number = 0) {
  const [viewerCount, setViewerCount] = useState(initialCount);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownCountRef = useRef(initialCount);

  // Debounced viewer count update - prevents flickering on rapid changes
  const updateViewerCount = useCallback((newCount: number) => {
    // Clear any pending updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Store as last known count immediately
    lastKnownCountRef.current = newCount;

    // Update UI immediately for instant feedback, with minimal debounce for rapid changes
    setViewerCount(newCount);
    
    // Only debounce stability state to prevent rapid flickering
    debounceTimerRef.current = setTimeout(() => {
      // Stability indicator - could be used for UI feedback if needed
    }, 100); // Reduced to 100ms for faster stability indication
  }, []);

  useStreamEvent(streamId, 'viewer.joined', (event) => {
    if (event.data && typeof event.data === 'object' && 'viewerCount' in event.data) {
      updateViewerCount((event.data as { viewerCount: number }).viewerCount);
    }
  });

  useStreamEvent(streamId, 'viewer.left', (event) => {
    if (event.data && typeof event.data === 'object' && 'viewerCount' in event.data) {
      updateViewerCount((event.data as { viewerCount: number }).viewerCount);
    }
  });

  useStreamEvent(streamId, 'viewer.count.updated', (event) => {
    if (event.data && typeof event.data === 'object' && 'viewerCount' in event.data) {
      updateViewerCount((event.data as { viewerCount: number }).viewerCount);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return viewerCount;
}

/**
 * Hook for stream live status with reconnecting state
 */
export function useStreamLiveStatus(streamId: string, initialStatus: boolean = false) {
  const [isLive, setIsLive] = useState(initialStatus);
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const offlineTimerRef = useRef<NodeJS.Timeout | null>(null);

  useStreamEvent(streamId, 'stream.started', () => {
    // Clear any pending offline timer
    if (offlineTimerRef.current) {
      clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = null;
    }
    setIsLive(true);
    setConnectionState('connected');
  });

  useStreamEvent(streamId, 'stream.ended', () => {
    // Show "reconnecting" state for 5 seconds before going offline
    setConnectionState('reconnecting');
    
    // Wait 5 seconds before declaring stream truly offline
    offlineTimerRef.current = setTimeout(() => {
      setIsLive(false);
      setConnectionState('disconnected');
    }, 5000); // 5 second buffer for slow connections
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
      }
    };
  }, []);

  return { isLive, connectionState };
}
