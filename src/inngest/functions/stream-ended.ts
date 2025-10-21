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

    logger.info(`[Inngest] Processing stream ended for ingress: ${ingressId}`);

    // Update database with atomic operation
    const stream = await step.run("update-stream-status", async () => {
      return await db.stream.update({
        where: {
          ingressId: ingressId,
        },
        data: {
          isLive: false,
          viewerCount: 0, // Reset viewers when stream ends
        },
      });
    });

    logger.info(`[Inngest] Stream ${stream.id} ended, viewers reset to 0`);

        // Step 2: 🚀 OPTIMIZED - Smart cache invalidation (stream status changed)
        await step.run("invalidate-cache", async () => {
            await CacheService.invalidateStreamStatusCache(stream.id, false);
            logger.info(`[Inngest] Stream status cache invalidated for stream ${stream.id}`);
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