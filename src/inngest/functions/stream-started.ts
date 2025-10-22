import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { CacheService } from "@/server/services/cache.service";
import { SSEEventPublisher } from "@/lib/sse";
import { logger } from "@/lib/logger";

export const streamStarted = inngest.createFunction(
    {
        id: "stream-started",
        name: "HandleStream Started",
        retries: 5,
        debounce: {
            period: "10s",
            key: "event.data.ingressId",
        },
        concurrency: {
            limit: 5,
            key: "event.data.ingressId",
        },
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
                // First check if stream is already live to prevent unnecessary updates
                const existingStream = await db.stream.findUnique({
                    where: { ingressId },
                    select: { id: true, isLive: true, updatedAt: true },
                });

                if (!existingStream) {
                    logger.error(`[Inngest] Stream with ingressId ${ingressId} not found in database`, {
                        ingressId,
                        availableStreams: await db.stream.findMany({
                            select: { id: true, ingressId: true, userId: true, name: true },
                            take: 5
                        })
                    });
                    throw new Error(`Stream with ingressId ${ingressId} not found`);
                }

                // Check if stream was recently updated to prevent rapid state changes
                const recentUpdateThreshold = new Date(Date.now() - 10000); // 10 seconds ago
                
                if (existingStream.updatedAt && existingStream.updatedAt > recentUpdateThreshold) {
                    logger.info(`[Inngest] Stream ${existingStream.id} was recently updated, skipping to prevent flickering`, {
                        lastUpdated: existingStream.updatedAt,
                        threshold: recentUpdateThreshold,
                        timeSinceUpdate: Date.now() - existingStream.updatedAt.getTime()
                    });
                    return await db.stream.findUnique({
                        where: { ingressId },
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
                }

                // If already live, skip update to prevent flickering
                if (existingStream.isLive) {
                    logger.info(`[Inngest] Stream ${existingStream.id} is already live, skipping update`);
                    return await db.stream.findUnique({
                        where: { ingressId },
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
                }

                const result = await db.stream.update({
                    where: { ingressId },
                    data: { isLive: true },
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
                logger.info(`[Inngest] Successfully updated stream ${result.id} to live`);
                return result;
            } catch (error) {
                logger.error(`[Inngest] Failed to update stream status for ingress ${ingressId}`, error as Error);
                throw error; // Re-throw to trigger retry
            }
        }, {
            timeout: 10000, // 10 second timeout for production
            isolationLevel: 'ReadCommitted', // Prevent dirty reads
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
                    await SSEEventPublisher.publishStreamStarted(stream.id, stream.userId, {
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
