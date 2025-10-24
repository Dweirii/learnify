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
    createdAt: string | Date; // normalized to string on wire
    updatedAt: string | Date; // normalized to string on wire
  };
  // You referenced viewerCount in stream.ended handling:
  viewerCount?: number;
}

interface UseStreamListOptions {
  category?: string;
  initialStreams?: StreamListItem[];
  autoReconnect?: boolean;
  reconnectInterval?: number;    // base ms
  maxReconnectAttempts?: number; // max tries before giving up
}

interface UseStreamListReturn {
  streams: StreamListItem[];
  isConnected: boolean;
  error: Error | null;
  refetch: () => void;
}

type SSEPayload = {
  type: string;
  streamId?: string;
  userId?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
};

function safeJSON<T = Record<string, unknown>>(s: string): T | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Keep list sorted: live first, then by updatedAt desc
function sortStreams(a: StreamListItem, b: StreamListItem) {
  if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
  const au = new Date(a.user.updatedAt).getTime();
  const bu = new Date(b.user.updatedAt).getTime();
  return bu - au;
}

// Merge/update helpers
function upsertStream(list: StreamListItem[], incoming: StreamListItem) {
  const idx = list.findIndex((s) => s.id === incoming.id);
  if (idx === -1) return [incoming, ...list].sort(sortStreams);
  const updated = [...list];
  updated[idx] = { ...updated[idx], ...incoming };
  return updated.sort(sortStreams);
}

function markStreamEnded(list: StreamListItem[], streamId: string) {
  return list.map((s) =>
    s.id === streamId ? { ...s, isLive: false, viewerCount: 0 } : s
  );
}

export function useStreamList(options: UseStreamListOptions = {}): UseStreamListReturn {
  const {
    category,
    initialStreams = [],
    autoReconnect: _autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const [streams, setStreams] = useState<StreamListItem[]>(initialStreams);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const buildSSEUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("type", "stream-list");
    if (category) params.append("category", category);
    return `/api/stream-updates?${params.toString()}`;
  }, [category]);

  // Debounced apply to avoid flicker on bursts
  const scheduleApply = useCallback((fn: () => void) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(fn, 100); // faster debounce for better UX
  }, []);

  // Event handlers (named SSE events)
  const onConnectionEstablished = useCallback((e: MessageEvent) => {
    const payload = safeJSON<SSEPayload>(e.data);
    if (!payload) return;
    // Mark as connected, reset error/retries
    setIsConnected(true);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const onConnectionStats = useCallback((e: MessageEvent) => {
    // Optional: you can surface stats if needed
    const _payload = safeJSON<SSEPayload>(e.data);
    // no-op by default
  }, []);

  const onStreamStarted = useCallback((e: MessageEvent) => {
    const payload = safeJSON<SSEPayload>(e.data);
    if (!payload?.data) return;

    // category filtering (server already filters, but double-guard client)
    if (category && payload.data.category && payload.data.category !== category) return;

    const incoming = payload.data as unknown as StreamListItem;
    // Normalize dates to strings (avoid Date objects in state)
    if (incoming?.user) {
      incoming.user = {
        ...incoming.user,
        createdAt: String(incoming.user.createdAt),
        updatedAt: String(incoming.user.updatedAt),
      };
    }
    
    // Immediate optimistic update for better UX
    setStreams((prev) => upsertStream(prev, { ...incoming, isLive: true }));
    
    // Also schedule debounced update as backup
    scheduleApply(() => {
      setStreams((prev) => upsertStream(prev, { ...incoming, isLive: true }));
    });
  }, [category, scheduleApply]);

  const onStreamEnded = useCallback((e: MessageEvent) => {
    const payload = safeJSON<SSEPayload>(e.data);
    if (!payload?.streamId) return;
    scheduleApply(() => {
      setStreams((prev) => markStreamEnded(prev, payload.streamId!));
    });
  }, [scheduleApply]);

  const onStreamUpdated = useCallback((e: MessageEvent) => {
    const payload = safeJSON<SSEPayload>(e.data);
    if (!payload?.data) return;
    const incoming = payload.data as unknown as StreamListItem;
    if (incoming?.user) {
      incoming.user = {
        ...incoming.user,
        createdAt: String(incoming.user.createdAt),
        updatedAt: String(incoming.user.updatedAt),
      };
    }
    scheduleApply(() => {
      setStreams((prev) => upsertStream(prev, incoming));
    });
  }, [scheduleApply]);

  const handleOpen = useCallback(() => {
    // EventSource fires open on first successful connection
    setIsConnected(true);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Reconnect strategy with backoff + jitter
  const scheduleReconnect = useCallback(() => {
    if (!_autoReconnect) return;
    const attempt = reconnectAttemptsRef.current;
    if (attempt >= maxReconnectAttempts) {
      const err = new Error("Failed to establish connection after multiple attempts");
      logger.error("[useStreamList] Max reconnection attempts reached", err);
      setError(err);
      return;
    }
    const jitter = Math.floor(Math.random() * 500);
    const delay = reconnectInterval * Math.pow(2, attempt) + jitter;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      reconnectAttemptsRef.current += 1;
      // Call connect directly to avoid circular dependency
      const url = buildSSEUrl();
      try {
        const es = new EventSource(url);
        eventSourceRef.current = es;
        es.onopen = handleOpen;
        es.onerror = () => {
          setIsConnected(false);
          setError(new Error("SSE connection error"));
          scheduleReconnect();
        };
        es.addEventListener("connection.established", onConnectionEstablished);
        es.addEventListener("connection.stats", onConnectionStats);
        es.addEventListener("stream.started", onStreamStarted);
        es.addEventListener("stream.ended", onStreamEnded);
        es.addEventListener("stream.updated", onStreamUpdated);
      } catch (err) {
        logger.error("[useStreamList] Failed to reconnect", err as Error);
        setError(new Error("Failed to reconnect"));
      }
    }, delay);
  }, [_autoReconnect, reconnectInterval, maxReconnectAttempts, buildSSEUrl, handleOpen, onConnectionEstablished, onConnectionStats, onStreamStarted, onStreamEnded, onStreamUpdated]);

  const handleError = useCallback(() => {
    // Any network glitch or server close will trigger this
    setIsConnected(false);
    setError(new Error("SSE connection error"));
    scheduleReconnect();
  }, [scheduleReconnect]);

  const connect = useCallback(() => {
    // Cleanup previous
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const url = buildSSEUrl();
    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      // Core lifecycle
      es.onopen = handleOpen;
      es.onerror = handleError;

      // Named events (must match server `event:`)
      es.addEventListener("connection.established", onConnectionEstablished);
      es.addEventListener("connection.stats", onConnectionStats);
      es.addEventListener("stream.started", onStreamStarted);
      es.addEventListener("stream.ended", onStreamEnded);
      es.addEventListener("stream.updated", onStreamUpdated);

      // Note: server heartbeats are SSE comments (`: ping ...`), which the browser ignores
      // so no listener needed for ping.

    } catch (err) {
      logger.error("[useStreamList] Failed to create EventSource", err as Error);
      setError(new Error("Failed to create SSE connection"));
      scheduleReconnect();
    }
  }, [
    buildSSEUrl,
    handleOpen,
    handleError,
    onConnectionEstablished,
    onConnectionStats,
    onStreamStarted,
    onStreamEnded,
    onStreamUpdated,
    scheduleReconnect,
  ]);


  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
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
    disconnect();
    // Give the server a brief moment to settle before reconnecting
    setTimeout(connect, 50);
  }, [disconnect, connect]);

  // (Re)connect on mount and when category changes
  useEffect(() => {
    isMountedRef.current = true;
    connect();
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return { streams, isConnected, error, refetch };
}
