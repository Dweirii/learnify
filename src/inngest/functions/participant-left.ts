import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { CacheService } from "@/server/services/cache.service";
import { SSEEventPublisher } from "@/lib/sse";
import { logger } from "@/lib/logger";

export const participantLeft = inngest.createFunction(
  {
    id: "participant-left",
    name: "Handle Participant Left",
    retries: 5, // Increased retries for production
    concurrency: {
      limit: 10, // Prevent overwhelming the database
      key: "event.data.userId",
    },
    
    debounce: {
      period: "2s", // Increased debounce for stability
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

            // Atomic decrement with production-ready error handling
            const result = await tx.stream.update({
              where: { id: currentStream.id },
              data: {
                viewerCount: {
                  decrement: 1,
                },
                updatedAt: new Date(), // Ensure updatedAt is refreshed
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
            
            logger.info(`[Inngest] Viewer count decremented for stream ${result.id}: ${streamCheck.viewerCount} → ${result.viewerCount}`);
            return result;
          }, {
            timeout: 10000, // 10 second timeout for production
            isolationLevel: 'ReadCommitted', // Prevent dirty reads
          });
        } catch (error) {
          logger.error(`[Inngest] Failed to decrement viewer count for stream ${currentStream.id}`, error as Error);
          throw error; // Re-throw to trigger retry
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