// lib/sse.ts
import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import { logger } from "./logger";
import { redisPubSub, RedisPubSubManager, PubSubEvent } from "./redis-pubsub";

// ---------- Types ----------
export type StreamEventType =
  | "stream.started"
  | "stream.ended"
  | "viewer.joined"
  | "viewer.left"
  | "viewer.count.updated";

export interface StreamEvent {
  type: StreamEventType;
  streamId: string;
  userId: string;
  data: unknown;
  timestamp: string;
  __origin?: string; // internal-only, stripped before sending to clients
}

type ConnectionType = "stream-specific" | "stream-list";

interface ConnectionInfo {
  streamId: string;
  type: ConnectionType;
  category?: string;
  response: ReadableStreamDefaultController;
  lastPing: number;
  createdAt: number;
  timeoutId?: NodeJS.Timeout;
}

// ---------- Globals ----------
const textEncoder = new TextEncoder();
const ORIGIN_ID = process.env.INSTANCE_ID || randomUUID();

const CONNECTION_TIMEOUT_MS = 30 * 60 * 1000; // 30m
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;    // 5m
const HEARTBEAT_MS = Number(process.env.SSE_HEARTBEAT_MS || 25000); // 25s default

// ---------- Helpers ----------
function sanitizeForClient(evt: StreamEvent) {
  const { __origin: _origin, ...rest } = evt;
  return rest;
}
function formatSSE(evt: StreamEvent): string {
  const clientEvt = sanitizeForClient(evt);
  return `event: ${clientEvt.type}\ndata: ${JSON.stringify(clientEvt)}\n\n`;
}
function sseCommentPing(ts: string) {
  return `: ping ${ts}\n\n`;
}
function safeEnqueue(ctrl: ReadableStreamDefaultController, chunk: Uint8Array) {
  const ds = (ctrl as ReadableStreamDefaultController & { desiredSize?: number | null }).desiredSize as number | null | undefined;
  if (typeof ds === "number" && ds < -1024) return false; // drop if extremely backed up
  ctrl.enqueue(chunk);
  return true;
}

// ---------- Emitter (optional in-memory hooks) ----------
class SSEEventEmitter extends EventEmitter {
  private static instance: SSEEventEmitter;
  static getInstance(): SSEEventEmitter {
    if (!SSEEventEmitter.instance) SSEEventEmitter.instance = new SSEEventEmitter();
    return SSEEventEmitter.instance;
  }
  constructor() {
    super();
    this.setMaxListeners(100);
  }
  cleanup() {
    this.removeAllListeners();
    logger.info("[SSE] EventEmitter cleaned up");
  }
}
export const sseEmitter = SSEEventEmitter.getInstance();

// ---------- Connection Manager ----------
class SSEConnectionManager {
  private connections = new Map<string, ConnectionInfo>();
  private redisInitialized = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeRedisSubscriptions();
    this.startCleanupTimer();
    this.setupGracefulShutdown();
    this.setupProcessWarnings();
  }

  private async initializeRedisSubscriptions() {
    if (this.redisInitialized) return;
    try {
      await redisPubSub.subscribe(
        RedisPubSubManager.getChannelName("streams"),
        (event: PubSubEvent) => this.handleRedisEvent(event)
      );
      this.redisInitialized = true;
      logger.info("[SSE] Redis Pub/Sub subscriptions initialized");
    } catch (error) {
      logger.error("[SSE] Failed to initialize Redis subscriptions:", error as Error);
    }
  }

  private handleRedisEvent(event: PubSubEvent) {
    try {
      // Ignore events from our own origin to prevent self-echo
      const origin = (event as PubSubEvent & { __origin?: string; serverId?: string }).__origin || (event as PubSubEvent & { __origin?: string; serverId?: string }).serverId || event.data?.__origin;
      if (origin === ORIGIN_ID) return;

      const sseEvent: StreamEvent = {
        type: event.type as StreamEventType,
        streamId: typeof event.data?.streamId === "string"
          ? event.data.streamId
          : typeof event.data?.id === "string"
            ? event.data.id
            : "unknown",
        userId: typeof event.data?.userId === "string"
          ? event.data.userId
          : "unknown",
        data: event.data && typeof event.data === "object" ? event.data : {},
        timestamp: new Date(event.timestamp ?? Date.now()).toISOString(),
      };

      switch (sseEvent.type) {
        case "stream.started":
        case "stream.ended": {
          const category =
            typeof event.data?.category === "string"
              ? event.data.category
              : undefined;
          this.sendToStreamList(sseEvent, category);
          break;
        }
        case "viewer.joined":
        case "viewer.left":
        case "viewer.count.updated":
          this.sendToStream(sseEvent.streamId, sseEvent);
          break;
        default:
          logger.debug(`[SSE] Unhandled Redis event type: ${sseEvent.type}`);
      }
    } catch (error) {
      logger.error("[SSE] Failed to handle Redis event:", error as Error);
    }
  }

  private startCleanupTimer() {
    this.cleanupInterval = setInterval(() => this.cleanupStaleConnections(), CLEANUP_INTERVAL_MS);
    logger.info("[SSE] Cleanup timer started");
  }

  private cleanupStaleConnections() {
    const now = Date.now();
    const stale: string[] = [];
    for (const [id, c] of this.connections) {
      const sincePing = now - c.lastPing;
      const sinceCreated = now - c.createdAt;
      if (sincePing > CONNECTION_TIMEOUT_MS || sinceCreated > 2 * 60 * 60 * 1000) stale.push(id);
    }
    for (const id of stale) this.removeConnection(id);
    if (stale.length) logger.info(`[SSE] Cleaned up ${stale.length} stale connections`);
  }

  private setupGracefulShutdown() {
    const shutdown = async () => {
      logger.info("[SSE] Graceful shutdown initiated");
      if (this.cleanupInterval) clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;

      for (const [id, c] of this.connections) {
        try {
          if (c.timeoutId) clearTimeout(c.timeoutId);
          c.response.close();
        } catch (e) {
          logger.error(`[SSE] Error closing connection ${id}:`, e as Error);
        }
      }
      this.connections.clear();

      try {
        await redisPubSub.disconnect();
        logger.info("[SSE] Redis Pub/Sub disconnected");
      } catch (e) {
        logger.error("[SSE] Error disconnecting from Redis:", e as Error);
      }
      sseEmitter.cleanup();
      logger.info("[SSE] Graceful shutdown completed");
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("SIGUSR2", shutdown);
  }

  private setupProcessWarnings() {
    process.on("warning", (w) => {
      logger.warn("[SSE] Process warning:", { warning: w.message });
    });
  }

  addConnection(
    connectionId: string,
    streamId: string,
    controller: ReadableStreamDefaultController,
    type: ConnectionType,
    category?: string
  ) {
    const now = Date.now();
    const timeoutId = setTimeout(() => {
      logger.warn(`[SSE] Connection ${connectionId} timed out, removing`);
      this.removeConnection(connectionId);
    }, CONNECTION_TIMEOUT_MS);

    this.connections.set(connectionId, {
      streamId,
      type,
      category,
      response: controller,
      lastPing: now,
      createdAt: now,
      timeoutId,
    });

    logger.info(`[SSE] Connection ${connectionId} added`, {
      type,
      streamId,
      category,
      totalConnections: this.connections.size,
    });
  }

  removeConnection(connectionId: string) {
    const c = this.connections.get(connectionId);
    if (!c) return;
    if (c.timeoutId) clearTimeout(c.timeoutId);
    try {
      c.response.close();
    } catch (e) {
      logger.debug(`[SSE] Error closing controller for ${connectionId}:`, { error: e as Error });
    }
    this.connections.delete(connectionId);
    logger.info(`[SSE] Connection ${connectionId} removed`, { totalConnections: this.connections.size });
  }

  forEachConnection(fn: (id: string, c: ConnectionInfo) => void) {
    for (const [id, c] of this.connections) fn(id, c);
  }

  sendToStream(streamId: string, event: StreamEvent) {
    let sent = 0;
    const chunk = textEncoder.encode(formatSSE(event));
    this.forEachConnection((id, c) => {
      if (c.streamId !== streamId) return;
      try {
        const ok = safeEnqueue(c.response, chunk);
        if (!ok) return;
        sent++;
      } catch (e) {
        logger.error(`[SSE] Failed to send to connection ${id}`, e as Error);
        this.removeConnection(id);
      }
    });
    logger.debug(`[SSE] Event sent to ${sent} connections for stream ${streamId}`);
  }

  sendToStreamList(event: StreamEvent, category?: string) {
    let sent = 0;
    const chunk = textEncoder.encode(formatSSE(event));
    this.forEachConnection((id, c) => {
      if (c.type !== "stream-list") return;
      if (category && c.category && c.category !== category) return;
      try {
        const ok = safeEnqueue(c.response, chunk);
        if (!ok) return;
        sent++;
      } catch (e) {
        logger.error(`[SSE] Failed to send to connection ${id}`, e as Error);
        this.removeConnection(id);
      }
    });
    logger.debug(`[SSE] Stream list event sent to ${sent} local connections`, { category });
  }

  // Stats
  getConnectionCount() { return this.connections.size; }
  getStreamConnectionCount(streamId: string) {
    let n = 0; this.forEachConnection((_id, c) => { if (c.streamId === streamId) n++; }); return n;
  }
  getStreamListConnectionCount(category?: string) {
    let n = 0; this.forEachConnection((_id, c) => {
      if (c.type !== "stream-list") return;
      if (!category || c.category === category) n++;
    }); return n;
  }
}

export const sseManager = new SSEConnectionManager();

// ---------- Publisher (centralizes Redis publish) ----------
const viewerCountBuffer = new Map<string, { count: number; t?: NodeJS.Timeout }>();

export class SSEEventPublisher {
  static async publishStreamStarted(streamId: string, userId: string, data: Record<string, unknown>) {
    const event: StreamEvent = {
      type: "stream.started",
      streamId, userId, data,
      timestamp: new Date().toISOString(),
      __origin: ORIGIN_ID,
    };
    sseManager.sendToStream(streamId, event);
    sseManager.sendToStreamList(event, data?.category as string | undefined);
    await publishToRedis(event);
    sseEmitter.emit("stream.started", event);
  }

  static async publishStreamEnded(streamId: string, userId: string, data: Record<string, unknown>) {
    const event: StreamEvent = {
      type: "stream.ended",
      streamId, userId, data,
      timestamp: new Date().toISOString(),
      __origin: ORIGIN_ID,
    };
    sseManager.sendToStream(streamId, event);
    sseManager.sendToStreamList(event, data?.category as string | undefined);
    await publishToRedis(event);
    sseEmitter.emit("stream.ended", event);
  }

  static publishViewerJoined(streamId: string, userId: string, viewerCount: number) {
    const event: StreamEvent = {
      type: "viewer.joined",
      streamId, userId, data: { viewerCount },
      timestamp: new Date().toISOString(),
      __origin: ORIGIN_ID,
    };
    sseManager.sendToStream(streamId, event);
    sseEmitter.emit("viewer.joined", event);
  }

  static publishViewerLeft(streamId: string, userId: string, viewerCount: number) {
    const event: StreamEvent = {
      type: "viewer.left",
      streamId, userId, data: { viewerCount },
      timestamp: new Date().toISOString(),
      __origin: ORIGIN_ID,
    };
    sseManager.sendToStream(streamId, event);
    sseEmitter.emit("viewer.left", event);
  }

  // Debounced to prevent floods during bursts
  static publishViewerCountUpdate(streamId: string, userId: string, viewerCount: number) {
    const key = streamId;
    const curr = viewerCountBuffer.get(key) ?? { count: viewerCount };
    curr.count = viewerCount;
    if (curr.t) clearTimeout(curr.t);
    curr.t = setTimeout(() => {
      const ev: StreamEvent = {
        type: "viewer.count.updated",
        streamId, userId,
        data: { viewerCount: curr.count },
        timestamp: new Date().toISOString(),
        __origin: ORIGIN_ID,
      };
      sseManager.sendToStream(streamId, ev);
      sseEmitter.emit("viewer.count.updated", ev);
      viewerCountBuffer.delete(key);
    }, 250);
    viewerCountBuffer.set(key, curr);
  }
}

async function publishToRedis(event: StreamEvent) {
  try {
    await redisPubSub.publish(
      RedisPubSubManager.getChannelName("streams"),
      { ...event, serverId: ORIGIN_ID, __origin: ORIGIN_ID }
    );
    logger.debug("[SSE] Event published to Redis for cross-server distribution");
  } catch (e) {
    logger.error("[SSE] Failed to publish to Redis:", e as Error);
  }
}

// ---------- Heartbeat ----------
class HeartbeatManager {
  private interval: NodeJS.Timeout | null = null;
  start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      const ping = textEncoder.encode(sseCommentPing(new Date().toISOString()));
      sseManager.forEachConnection((id, c) => {
        try {
          const ok = safeEnqueue(c.response, ping);
          if (!ok) return;
          c.lastPing = Date.now();
        } catch (e) {
          logger.error(`[SSE] Failed to send heartbeat to ${id}`, e as Error);
          sseManager.removeConnection(id);
        }
      });
    }, HEARTBEAT_MS);
    logger.info(`[SSE] Heartbeat manager started (${HEARTBEAT_MS} ms)`);
  }
  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = null;
    logger.info("[SSE] Heartbeat manager stopped");
  }
}
export const heartbeatManager = new HeartbeatManager();
heartbeatManager.start();
