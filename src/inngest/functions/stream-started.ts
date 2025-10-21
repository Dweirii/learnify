import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { CacheService } from "@/server/services/cache.service";
import { SSEEventPublisher } from "@/lib/sse";
import { logger } from "@/lib/logger";

export const streamStarted = inngest.createFunction(
    {
        id: "stream-started",
        name: "HandleStream Started",

        // Retry configuration: 3 attemps with exponential backoff
        retries: 3,

        // Cancel function if another "stream-started" event comes for same stream
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
        logger.info(`[Inngest] Processing stream started for ingress: ${ingressId}`);

        const stream = await step.run("update-stream-status", async () => {
            return await db.stream.update({
                where: { ingressId },
                data: { isLive: true },
            });
        });

        logger.info(`[Inngest] Stream ${stream.id} is now live`);

        // Step 2: 🚀 OPTIMIZED - Smart cache invalidation (stream status changed)
        await step.run("invalidate-cache", async () => {
            await CacheService.invalidateStreamStatusCache(stream.id, true);
            logger.info(`[Inngest] Stream status cache invalidated for stream ${stream.id}`);
        });

        // Step 3: Publish SSE event
        await step.run("publish-sse-event", async () => {
            SSEEventPublisher.publishStreamStarted(stream.id, stream.userId, {
                isLive: true,
                ingressId: ingressId,
            });
            logger.info(`[Inngest] SSE event published for stream ${stream.id}`);
        });

    // Return success data (visible in Inngest dashboard)
    return {
        success: true,
        streamId: stream.id,
        ingressId: ingressId,
        isLive: true,
    };
});
