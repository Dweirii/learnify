"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";

export interface StreamListItem {
  id: string;
  name: string;
  isLive: boolean;
  thumbnailUrl: string | null;
  category: string;
  user: {
    id: string;
    username: string;
    imageUrl: string;
    bio: string | null;
    externalUserId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface UseStreamListOptions {
  category?: string;
  initialStreams: StreamListItem[];
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseStreamListReturn {
  streams: StreamListItem[];
  isConnected: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStreamList(options: UseStreamListOptions): UseStreamListReturn {
  const {
    category,
    initialStreams,
    autoReconnect = true,
    reconnectInterval = 5000, // Start with 5 seconds (reduced spam)
    maxReconnectAttempts = 3,  // Only try 3 times to prevent infinite loops
  } = options;

  const [streams, setStreams] = useState<StreamListItem[]>(initialStreams);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const buildSSEUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (category) {
      params.append('category', category);
    }
    
    params.append('type', 'stream-list');
    
    return `/api/stream-updates?${params.toString()}`;
  }, [category]);

  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Reduced logging for performance - only log errors
  
      // Clear existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce rapid events to prevent flickering
      debounceTimeoutRef.current = setTimeout(() => {
        switch (data.type) {
        case 'stream.started':
          // Add new stream to the list with sorting
          setStreams((prev) => {
            // Check if category matches (if filter is applied)
            if (category && data.data.category !== category) {
              return prev;
            }
            
            // Check if stream already exists and update it
            const existingIndex = prev.findIndex(s => s.id === data.data.id);
            if (existingIndex !== -1) {
              // Update existing stream
              const updated = [...prev];
              updated[existingIndex] = { ...updated[existingIndex], ...data.data, isLive: true };
              return updated.sort((a, b) => {
                if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
                return new Date(b.user.updatedAt).getTime() - new Date(a.user.updatedAt).getTime();
              });
            }
            
            // Add new stream and sort by live status first, then by updated date
            const updated = [data.data, ...prev];
            return updated.sort((a, b) => {
              if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
              return new Date(b.user.updatedAt).getTime() - new Date(a.user.updatedAt).getTime();
            });
          });
          break;
  
        case 'stream.ended':
          // Update stream to offline instead of removing completely
          // Reduced logging for performance
          setStreams((prev) => {
            const updated = prev.map(s => s.id === data.streamId ? { ...s, isLive: false, viewerCount: 0 } : s);
            return updated;
          });
          break;
  
        case 'stream.updated':
          // Update existing stream data
          setStreams((prev) => 
            prev.map(s => s.id === data.data.id ? { ...s, ...data.data } : s)
          );
          break;
  
        case 'ping':
          // Heartbeat - do nothing
          break;
  
        default:
          // Reduced logging for performance
        }
      }, 1000); // 1 second debounce
    } catch (err) {
      logger.error('[useStreamList] Failed to parse SSE event', err as Error);
    }
  }, [category]);
  
  const handleOpen = useCallback(() => {
    // Reduced logging for performance
    setIsConnected(true);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);
  
  const handleError = useCallback(() => {
    logger.error('[useStreamList] SSE connection error', new Error('SSE connection error'));
    
    setError(new Error('SSE connection error'));
    setIsConnected(false);
    
    // Attempt reconnection
    if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
      const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current);
      // Reduced logging for performance
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setTimeout(() => connect(), 0);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          logger.error('[useStreamList] Max reconnection attempts reached, giving up');
          setError(new Error('Failed to establish connection after multiple attempts'));
        }
      }, delay);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [autoReconnect, reconnectInterval, maxReconnectAttempts]); 
  
  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
  
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  
    const url = buildSSEUrl();
    // Reduced logging for performance
  
    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
  
      eventSource.onopen = handleOpen;
      eventSource.onmessage = handleEvent;
      eventSource.onerror = handleError;
    } catch (err) {
      logger.error('[useStreamList] Failed to create EventSource', err as Error);
      setError(new Error('Failed to create SSE connection'));
    }
  }, [buildSSEUrl, handleOpen, handleEvent, handleError]);
  
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      // Reduced logging for performance
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);
  
  const refetch = useCallback(() => {
    // Reduced logging for performance
    disconnect();
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      disconnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);   
  
  return {
    streams,
    isConnected,
    error,
    refetch,
  };
}