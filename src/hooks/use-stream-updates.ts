"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";

/** Server payload shape */
export type StreamEventType =
  | "stream.started"
  | "stream.ended"
  | "viewer.joined"
  | "viewer.left"
  | "viewer.count.updated"
  | "connection.established"
  | "connection.stats";

export interface StreamEvent {
  type: StreamEventType;
  streamId: string;
  userId: string;
  data: unknown;
  timestamp: string;
}

export interface ConnectionStats {
  totalConnections: number;
  streamConnections: number;
  streamListConnections?: number;
}

export interface UseStreamUpdatesOptions {
  /** leave undefined to subscribe to stream-list */
  streamId?: string;
  userId?: string;
  category?: string; // for stream-list
  autoReconnect?: boolean;
  reconnectInterval?: number;    // base ms
  maxReconnectAttempts?: number; // max tries
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface UseStreamUpdatesReturn {
  isConnected: boolean;
  connectionStats: ConnectionStats | null;
  /** last received event of ANY type (named events) */
  lastEvent: StreamEvent | null;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}

/** Safe JSON parse */
function safeJSON<T>(s: string): T | null {
  try { return JSON.parse(s); } catch { return null; }
}

/** Build SSE URL based on subscription mode */
function buildSSEUrl(opts: { streamId?: string; userId?: string; category?: string }) {
  const { streamId, userId, category } = opts;
  const url = new URL("/api/stream-updates", window.location.origin);
  if (streamId) url.searchParams.set("streamId", String(streamId));
  if (userId) url.searchParams.set("userId", String(userId));
  if (!streamId) {
    // stream-list subscription
    url.searchParams.set("type", "stream-list");
    if (category) url.searchParams.set("category", category);
  }
  return url.toString();
}

/**
 * Main hook: establishes ONE EventSource and exposes the last named event.
 * Listens to server's named events via addEventListener(...).
 */
export function useStreamUpdates(options: UseStreamUpdatesOptions = {}): UseStreamUpdatesReturn {
  const {
    streamId,
    userId = "anonymous",
    category,
    reconnectInterval = 4000,
    maxReconnectAttempts = 5,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  const [lastEvent, setLastEvent] = useState<StreamEvent | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  // Debounce batcher for UI smoothness
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedule = useCallback((fn: () => void, ms = 300) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fn, ms);
  }, []);

  const addHandler = useCallback(
    (es: EventSource, name: StreamEventType, handler: (e: MessageEvent) => void) => {
      es.addEventListener(name, handler as EventListener);
      return () => es.removeEventListener(name, handler as EventListener);
    },
    []
  );

  const handleEstablished = useCallback((e: MessageEvent) => {
    const payload = safeJSON<StreamEvent>(e.data);
    setIsConnected(true);
    setError(null);
    reconnectAttemptsRef.current = 0;
    if (payload) setLastEvent(payload);
    onConnect?.();
  }, [onConnect]);

  const handleStats = useCallback((e: MessageEvent) => {
    const payload = safeJSON<StreamEvent>(e.data);
    if (payload && payload.data && typeof payload.data === "object") {
      const d = payload.data as ConnectionStats;
      setConnectionStats({
        totalConnections: Number(d.totalConnections || 0),
        streamConnections: Number(d.streamConnections || 0),
        streamListConnections: d.streamListConnections != null ? Number(d.streamListConnections) : undefined,
      });
      setLastEvent(payload);
    }
  }, []);

  const handleGeneric = useCallback((e: MessageEvent) => {
    const evt = safeJSON<StreamEvent>(e.data);
    if (!evt || !evt.type) return;
    // Debounce to avoid UI thrash during bursts
    schedule(() => setLastEvent(evt));
  }, [schedule]);

  const handleOpen = useCallback(() => {
    setIsConnected(true);
    setError(null);
    reconnectAttemptsRef.current = 0;
    onConnect?.();
  }, [onConnect]);

  const connect = useCallback(() => {
    // cleanup previous
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const url = buildSSEUrl({ streamId, userId, category });
    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = handleOpen;
      es.onerror = () => {
        const err = new Error("SSE connection error");
        setError(err);
        setIsConnected(false);
        onError?.(err);
        // Schedule reconnect after a delay
        setTimeout(() => {
          if (!isMountedRef.current) return;
          reconnectAttemptsRef.current += 1;
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            connect();
          }
        }, reconnectInterval);
      };
      // Named events (must match server event: ...)
      const cleanups: Array<() => void> = [];
      cleanups.push(addHandler(es, "connection.established", handleEstablished));
      cleanups.push(addHandler(es, "connection.stats", handleStats));
      cleanups.push(addHandler(es, "stream.started", handleGeneric));
      cleanups.push(addHandler(es, "stream.ended", handleGeneric));
      cleanups.push(addHandler(es, "viewer.joined", handleGeneric));
      cleanups.push(addHandler(es, "viewer.left", handleGeneric));
      cleanups.push(addHandler(es, "viewer.count.updated", handleGeneric));

      // Return a disposer for this connection
      (es as EventSource & { __cleanup?: () => void }).__cleanup = () => cleanups.forEach((fn) => fn());
    } catch (err) {
      logger.error("[useStreamUpdates] Failed to create EventSource", err as Error);
      const e = new Error("Failed to create SSE connection");
      setError(e);
      // Schedule reconnect after a delay
      setTimeout(() => {
        if (!isMountedRef.current) return;
        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          connect();
        }
      }, reconnectInterval);
    }
  }, [streamId, userId, category, addHandler, handleEstablished, handleStats, handleGeneric, handleOpen, maxReconnectAttempts, reconnectInterval, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      try {
        const es = eventSourceRef.current as EventSource & { __cleanup?: () => void };
        if (typeof es.__cleanup === "function") es.__cleanup();
      } catch {}
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setIsConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    setTimeout(() => isMountedRef.current && connect(), 80);
  }, [disconnect, connect]);

  // mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    connect();
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId, userId, category]);

  return { isConnected, connectionStats, lastEvent, error, reconnect, disconnect };
}

/**
 * Sub-hook: consume specific event types from the parent hook's lastEvent.
 * NOTE: pass in the `lastEvent` you got from `useStreamUpdates` to avoid opening new connections.
 */
export function useStreamEventFrom(
  lastEvent: StreamEvent | null,
  eventType: StreamEventType,
  callback: (event: StreamEvent) => void
) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== eventType) return;
    cbRef.current(lastEvent);
  }, [lastEvent, eventType]);
}

/**
 * Viewer count hook using the parent lastEvent (no extra EventSource).
 */
export function useViewerCountFrom(lastEvent: StreamEvent | null, initial = 0) {
  const [viewerCount, setViewerCount] = useState(initial);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "viewer.count.updated" ||
      lastEvent.type === "viewer.joined" ||
      lastEvent.type === "viewer.left"
    ) {
      const vc = (lastEvent.data as Record<string, unknown>)?.viewerCount;
      if (typeof vc === "number") {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        // fast but smooth updates
        debounceRef.current = setTimeout(() => setViewerCount(vc), 100);
      }
    }
  }, [lastEvent]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);
  return viewerCount;
}

/**
 * Live status hook using the parent lastEvent (no extra EventSource).
 */
export function useStreamLiveStatusFrom(lastEvent: StreamEvent | null, initial = false) {
  const [isLive, setIsLive] = useState(initial);
  const [state, setState] = useState<"connected" | "reconnecting" | "disconnected">("connected");
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "stream.started") {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = null;
      // Immediate optimistic update
      setIsLive(true);
      setState("connected");
    } else if (lastEvent.type === "stream.ended") {
      setState("reconnecting");
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = setTimeout(() => {
        setIsLive(false);
        setState("disconnected");
      }, 2000); // Reduced grace period for faster offline detection
    }
  }, [lastEvent]);

  useEffect(() => () => { if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current); }, []);
  return { isLive, connectionState: state };
}
