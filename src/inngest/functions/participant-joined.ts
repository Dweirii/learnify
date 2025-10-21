import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { CacheService } from "@/server/services/cache.service";
import { SSEEventPublisher } from "@/lib/sse";
import { logger } from "@/lib/logger";

export const participantJoined = inngest.createFunction(
  {
    id: "participant-joined",
    name: "Handle Participant Joined",
    retries: 3,
    
    debounce: {
      period: "0.2s", // Reduced to 200ms for faster real-time updates
      key: "event.data.userId",
    },
  },
  
  { event: "livekit/participant.joined" },
  
  async ({ event, step }) => {
    const { userId, participantIdentity } = event.data;

    logger.info(`[Inngest] Participant joined: ${participantIdentity} in room: ${userId}`);

    // Increment viewer count atomically using transaction
    const stream = await step.run("increment-viewer-count", async () => {
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

        // Atomic increment
        return await tx.stream.update({
          where: { id: currentStream.id },
          data: {
            viewerCount: {
              increment: 1,
            },
          },
        });
      });
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