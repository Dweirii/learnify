import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { CacheService } from "@/server/services/cache.service";
import { SSEEventPublisher } from "@/lib/sse";
import { logger } from "@/lib/logger";

export const participantJoined = inngest.createFunction(
  {
    id: "participant-joined",
    name: "Handle Participant Joined",
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
  
  { event: "livekit/participant.joined" },
  
  async ({ event, step }) => {
    const { userId, participantIdentity } = event.data;

    logger.info(`[Inngest] Participant joined: ${participantIdentity} in room: ${userId}`);

    // Increment viewer count atomically using transaction
    const stream = await step.run("increment-viewer-count", async () => {
      try {
        return await db.$transaction(async (tx) => {
          // First, get current stream to ensure it exists
          const currentStream = await tx.stream.findUnique({
            where: { userId: userId },
            select: { id: true, viewerCount: true, isLive: true },
          });

          if (!currentStream) {
            throw new Error(`Stream not found for user: ${userId}`);
          }

          if (!currentStream.isLive) {
            logger.info(`[Inngest] Stream ${currentStream.id} is not live, skipping viewer increment`);
            return currentStream;
          }

          // Atomic increment with production-ready error handling
          const result = await tx.stream.update({
            where: { id: currentStream.id },
            data: {
              viewerCount: {
                increment: 1,
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
          
          logger.info(`[Inngest] Viewer count incremented for stream ${result.id}: ${currentStream.viewerCount} → ${result.viewerCount}`);
          return result;
        }, {
          timeout: 10000, // 10 second timeout for production
          isolationLevel: 'ReadCommitted', // Prevent dirty reads
        });
      } catch (error) {
        logger.error(`[Inngest] Failed to increment viewer count for user ${userId}`, error as Error);
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
        SSEEventPublisher.publishViewerJoined(stream.id, userId, stream.viewerCount);
        logger.info(`[Inngest] SSE viewer.joined event published for stream ${stream.id}`);
    });

    return {
      success: true,
      streamId: stream.id,
      userId: userId,
      viewerCount: stream.viewerCount,
      participantIdentity,
    };
  }
);