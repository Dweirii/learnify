import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { CacheService } from "@/server/services/cache.service";
import { SSEEventPublisher } from "@/lib/sse";
import { logger } from "@/lib/logger";

export const participantLeft = inngest.createFunction(
  {
    id: "participant-left",
    name: "Handle Participant Left",
    retries: 3,
    
    debounce: {
      period: "1s", // Minimum required by Inngest
      key: "event.data.userId",
    },
  },
  
  { event: "livekit/participant.left" },
  
  async ({ event, step }) => {
    const { userId, participantIdentity } = event.data;

    logger.info(`[Inngest] Participant left: ${participantIdentity} from room: ${userId}`);

    // First, check current viewer count to prevent going negative
    const currentStream = await step.run("check-current-count", async () => {
      try {
        const result = await db.stream.findUnique({
          where: { userId: userId },
          select: { id: true, viewerCount: true },
        });
        
        if (result) {
          logger.info(`[Inngest] Current viewer count for stream ${result.id}: ${result.viewerCount}`);
        }
        
        return result;
      } catch (error) {
        logger.error(`[Inngest] Failed to check current viewer count for user ${userId}`, error as Error);
        throw error;
      }
    });

    if (!currentStream) {
      logger.info(`[Inngest] Stream not found for user: ${userId}`);
      return { success: false, error: "Stream not found" };
    }

    // Only decrement if count is greater than 0
    if (currentStream.viewerCount > 0) {
      const stream = await step.run("decrement-viewer-count", async () => {
        try {
          return await db.$transaction(async (tx) => {
            // Double-check count hasn't changed
            const streamCheck = await tx.stream.findUnique({
              where: { id: currentStream.id },
              select: { viewerCount: true },
            });

            if (!streamCheck || streamCheck.viewerCount <= 0) {
              logger.info(`[Inngest] Viewer count already at 0, skipping decrement`);
              return currentStream;
            }

            // Atomic decrement
            const result = await tx.stream.update({
              where: { id: currentStream.id },
              data: {
                viewerCount: {
                  decrement: 1,
                },
              },
            });
            
            logger.info(`[Inngest] Successfully decremented viewer count for stream ${result.id}`);
            return result;
          });
        } catch (error) {
          logger.error(`[Inngest] Failed to decrement viewer count for stream ${currentStream.id}`, error as Error);
          throw error;
        }
      });

      logger.info(`[Inngest] Stream ${stream.id} viewer count: ${stream.viewerCount}`);

      // Step 2: 🚀 OPTIMIZED - Smart cache invalidation (only viewer count affected)
      await step.run("invalidate-cache", async () => {
        await CacheService.invalidateViewerCountCache(stream.id);
        logger.info(`[Inngest] Viewer count cache invalidated for stream ${stream.id}`);
      });

      // Step 3: Publish SSE event
      await step.run("publish-sse-event", async () => {
        SSEEventPublisher.publishViewerLeft(stream.id, userId, stream.viewerCount);
        logger.info(`[Inngest] SSE viewer.left event published for stream ${stream.id}`);
      });

      return {
        success: true,
        streamId: stream.id,
        userId: userId,
        viewerCount: stream.viewerCount,
        participantIdentity,
      };
    } else {
      logger.info(`[Inngest] Viewer count already at 0, skipping decrement`);
      
      return {
        success: true,
        streamId: currentStream.id,
        viewerCount: 0,
        skipped: true,
      };
    }
  }
);