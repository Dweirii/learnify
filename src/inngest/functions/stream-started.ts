import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { CacheService } from "@/server/services/cache.service";
import { SSEEventPublisher } from "@/lib/sse";
import { logger } from "@/lib/logger";

export const streamStarted = inngest.createFunction(
    {
        id: "stream-started",
        name: "HandleStream Started",
        retries: 3,
        cancelOn: [
            {
                event: "livekit/stream.started",
                match: "data.ingressId",
            },
        ],
    },
    { event: "livekit/stream.started" },
    async ({ event, step }) => {
        const { ingressId } = event.data;

        // Log the start of processing
        logger.info(`[Inngest] Processing stream started for ingress: ${ingressId}`, {
            eventType: event.name,
            eventData: event.data,
            timestamp: new Date().toISOString(),
        });

        const stream = await step.run("update-stream-status", async () => {
            try {
                const result = await db.stream.update({
                    where: { ingressId },
                    data: { isLive: true },
                });
                logger.info(`[Inngest] Successfully updated stream ${result.id} to live`);
                return result;
            } catch (error) {
                logger.error(`[Inngest] Failed to update stream status for ingress ${ingressId}`, error as Error);
                throw error; // Re-throw to trigger retry
            }
        });

        logger.info(`[Inngest] Stream ${stream.id} is now live`);

        // Step 2:  OPTIMIZED - Smart cache invalidation (stream status changed)
        await step.run("invalidate-cache", async () => {
            await CacheService.invalidateStreamStatusCache(stream.id, true);
            logger.info(`[Inngest] Stream status cache invalidated for stream ${stream.id}`);
        });

        // Step 3: Publish SSE event
        await step.run("publish-sse-event", async () => {
            try {
                const fullStream = await db.stream.findUnique({
                    where: { id: stream.id },
                    select: {
                        id: true,
                        name: true,
                        isLive: true,
                        thumbnailUrl: true,
                        category: true,
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
                }); // ✅ Fixed: Added missing semicolon!
            
                if (fullStream) {
                    SSEEventPublisher.publishStreamStarted(stream.id, stream.userId, {
                        id: fullStream.id,
                        name: fullStream.name,
                        isLive: fullStream.isLive,
                        thumbnailUrl: fullStream.thumbnailUrl,
                        category: fullStream.category,
                        user: fullStream.user,
                    });
                    logger.info(`[Inngest] SSE event published for stream ${stream.id}`);
                } else {
                    logger.error(`[Inngest] Stream ${stream.id} not found for SSE publishing`);
                }
            } catch (error) {
                logger.error(`[Inngest] Failed to publish SSE event for stream ${stream.id}`, error as Error);
                throw error;
            }
        });

    // Return success data (visible in Inngest dashboard)
    return {
        success: true,
        streamId: stream.id,
        ingressId: ingressId,
        isLive: true,
    };
});
