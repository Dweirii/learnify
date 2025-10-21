import { NextRequest } from "next/server";
import { sseManager, SSEEventPublisher } from "@/lib/sse";
import { logger } from "@/lib/logger";

/**
 * Server-Sent Events API Route
 * 
 * Provides real-time event streaming for stream updates
 * Clients can subscribe to specific streams or all streams
 * 
 * Usage:
 * GET /api/stream-updates?streamId=abc123
 * GET /api/stream-updates (all streams)
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const streamId = searchParams.get('streamId');
  const userId = searchParams.get('userId');

  // Generate unique connection ID
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info(`[SSE] New connection ${connectionId} for stream: ${streamId || 'all'}`);

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to manager
      sseManager.addConnection(connectionId, streamId || 'all', controller);

      // Send initial connection confirmation
      const welcomeMessage = {
        type: 'connection.established',
        streamId: streamId || 'all',
        userId: userId || 'anonymous',
        data: {
          connectionId,
          message: 'Connected to real-time stream updates',
        },
        timestamp: new Date().toISOString(),
      };

      const data = `data: ${JSON.stringify(welcomeMessage)}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));

      // Send current connection stats
      const statsMessage = {
        type: 'connection.stats',
        streamId: streamId || 'all',
        userId: userId || 'anonymous',
        data: {
          totalConnections: sseManager.getConnectionCount(),
          streamConnections: streamId ? sseManager.getStreamConnectionCount(streamId) : 0,
        },
        timestamp: new Date().toISOString(),
      };

      const statsData = `data: ${JSON.stringify(statsMessage)}\n\n`;
      controller.enqueue(new TextEncoder().encode(statsData));
    },

    cancel() {
      // Clean up connection when client disconnects
      logger.info(`[SSE] Connection ${connectionId} cancelled`);
      sseManager.removeConnection(connectionId);
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * Health check endpoint for SSE service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, streamId, userId, data } = body;

    // Validate required fields
    if (!type || !streamId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, streamId, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Publish event based on type
    switch (type) {
      case 'stream.started':
        SSEEventPublisher.publishStreamStarted(streamId, userId, data);
        break;
      case 'stream.ended':
        SSEEventPublisher.publishStreamEnded(streamId, userId, data);
        break;
      case 'viewer.joined':
        SSEEventPublisher.publishViewerJoined(streamId, userId, data.viewerCount);
        break;
      case 'viewer.left':
        SSEEventPublisher.publishViewerLeft(streamId, userId, data.viewerCount);
        break;
      case 'viewer.count.updated':
        SSEEventPublisher.publishViewerCountUpdate(streamId, userId, data.viewerCount);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown event type: ${type}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Event ${type} published successfully`,
        connections: sseManager.getConnectionCount(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('[SSE] Error publishing event', error as Error);
    return new Response(
      JSON.stringify({ error: 'Failed to publish event' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
