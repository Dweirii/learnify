// app/api/stream-updates/route.ts
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { sseManager } from "@/lib/sse";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const textEncoder = new TextEncoder();

function sseEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get("streamId") ?? null;
    const userId = searchParams.get("userId") ?? "anonymous";
    const type = (searchParams.get("type") as "stream-list" | "stream-specific" | null) ?? (streamId ? "stream-specific" : "stream-list");
    const category = searchParams.get("category") ?? undefined;

    const connectionId = `conn_${randomUUID()}`;
    const targetStreamId = type === "stream-list" ? "stream-list" : (streamId ?? "all");

    logger.info(`[SSE] New connection ${connectionId}`, {
      type,
      streamId: targetStreamId,
      category: category ?? "all",
      userAgent: request.headers.get("user-agent"),
      origin: request.headers.get("origin"),
    });

  const stream = new ReadableStream({
    start(controller) {
      // Add connection
      sseManager.addConnection(
        connectionId,
        targetStreamId,
        controller,
        type === "stream-list" ? "stream-list" : "stream-specific",
        category
      );

      // Initial hints
      controller.enqueue(textEncoder.encode(`retry: 10000\n`)); // client retry hint
      controller.enqueue(
        textEncoder.encode(
          sseEvent("connection.established", {
            type: "connection.established",
            streamId: targetStreamId,
            userId,
            data: {
              connectionId,
              connectionType: type,
              category: category ?? "all",
              message: "Connected to real-time stream updates",
            },
            timestamp: new Date().toISOString(),
          })
        )
      );

      controller.enqueue(
        textEncoder.encode(
          sseEvent("connection.stats", {
            type: "connection.stats",
            streamId: targetStreamId,
            userId,
            data: {
              totalConnections: sseManager.getConnectionCount(),
              streamConnections: streamId ? sseManager.getStreamConnectionCount(streamId) : 0,
              streamListConnections: type === "stream-list"
                ? sseManager.getStreamListConnectionCount(category)
                : 0,
            },
            timestamp: new Date().toISOString(),
          })
        )
      );

      // Abort/cleanup
      const onAbort = () => {
        logger.info(`[SSE] Connection ${connectionId} aborted`);
        sseManager.removeConnection(connectionId);
        try { controller.close(); } catch {}
      };
      if (request.signal.aborted) onAbort();
      else request.signal.addEventListener("abort", onAbort);
    },

    cancel() {
      logger.info(`[SSE] Connection ${connectionId} cancelled`);
      sseManager.removeConnection(connectionId);
    },
  });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    logger.error("[SSE] Error creating SSE connection", error as Error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create SSE connection", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}

// Optional: handy test publisher (CORS-friendly)
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, streamId, userId, data } = body || {};

    if (!type || !streamId || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields: type, streamId, userId" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const { SSEEventPublisher } = await import("@/lib/sse");

    switch (type as "stream.started" | "stream.ended" | "viewer.joined" | "viewer.left" | "viewer.count.updated") {
      case "stream.started":
        await SSEEventPublisher.publishStreamStarted(streamId, userId, data);
        break;
      case "stream.ended":
        await SSEEventPublisher.publishStreamEnded(streamId, userId, data);
        break;
      case "viewer.joined":
        SSEEventPublisher.publishViewerJoined(streamId, userId, data?.viewerCount);
        break;
      case "viewer.left":
        SSEEventPublisher.publishViewerLeft(streamId, userId, data?.viewerCount);
        break;
      case "viewer.count.updated":
        SSEEventPublisher.publishViewerCountUpdate(streamId, userId, data?.viewerCount);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown event type: ${type}` }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Event ${type} published`,
        connections: sseManager.getConnectionCount(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logger.error("[SSE] Error publishing event", error as Error);
    return new Response(JSON.stringify({ error: "Failed to publish event" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
