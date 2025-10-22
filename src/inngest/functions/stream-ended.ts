import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { CacheService } from "@/server/services/cache.service";
import { logger } from "@/lib/logger";

/**
 * Inngest Function: Handle Stream Ended Event
 * 
 * Triggered when: LiveKit ingress ends (broadcaster stops streaming)
 * 
 * What it does:
 * - Updates stream status to isLive = false
 * - Resets viewer count to 0
 * - Automatic retries on failure
 */
export const streamEnded = inngest.createFunction(
  {
    id: "stream-ended",
    name: "Handle Stream Ended",
    retries: 3,
    
    // Cancel if another "stream-ended" event comes for same stream
    cancelOn: [
      {
        event: "livekit/stream.ended",
        match: "data.ingressId",
      },
    ],
  },
  
  { event: "livekit/stream.ended" },
  
  async ({ event, step }) => {
    const { ingressId } = event.data;

    logger.info(`[Inngest] Processing stream ended for ingress: ${ingressId}`, {
      eventType: event.name,
      eventData: event.data,
      timestamp: new Date().toISOString(),
    });

    // Update database with atomic operation
    const stream = await step.run("update-stream-status", async () => {
      try {
        const result = await db.stream.update({
          where: {
            ingressId: ingressId,
          },
          data: {
            isLive: false,
            viewerCount: 0,
            // Keep the stream in database but mark as offline
            // Don't delete - this prevents flickering
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                imageUrl: true,
                bio: true,
                externalUserId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });
        logger.info(`[Inngest] Successfully updated stream ${result.id} to ended`);
        return result;
      } catch (error) {
        logger.error(`[Inngest] Failed to update stream status for ingress ${ingressId}`, error as Error);
        throw error; // Re-throw to trigger retry
      }
    });

    logger.info(`[Inngest] Stream ${stream.id} ended, viewers reset to 0`);

        // OPTIMIZED - Smart cache invalidation (stream status changed)
        await step.run("invalidate-cache", async () => {
            await CacheService.invalidateStreamStatusCache(stream.id, false);
            logger.info(`[Inngest] Stream status cache invalidated for stream ${stream.id}`);
        });

        // Publish SSE event for stream ended
        await step.run("publish-sse-event", async () => {
          const { SSEEventPublisher } = await import("@/lib/sse");
          
          const streamData = {
            id: stream.id,
            name: stream.name,
            isLive: false,
            thumbnailUrl: stream.thumbnailUrl,
            category: stream.category,
            user: stream.user,
          };
          
          logger.info(`[Inngest] Publishing SSE stream.ended event`, { 
            streamId: stream.id, 
            userId: stream.userId,
            data: streamData 
          });
          
          SSEEventPublisher.publishStreamEnded(stream.id, stream.userId, streamData);
          
          logger.info(`[Inngest] SSE event published for stream ended ${stream.id}`);
        });

    return {
      success: true,
      streamId: stream.id,
      ingressId: ingressId,
      isLive: false,
      viewerCount: 0,
    };
  }
);