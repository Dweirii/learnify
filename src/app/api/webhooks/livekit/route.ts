import { headers } from "next/headers";
import { WebhookReceiver } from "livekit-server-sdk";
import { inngest } from "@/lib/inngest";
import { logger, PerformanceTimer, extractRequestContext } from "@/lib/logger";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(req: Request) {
  const context = extractRequestContext(req);
  
  return await PerformanceTimer.time('livekit-webhook-processing', async () => {
    try {
      const body = await req.text();
      const headerPayload = await headers();
      const authorization = headerPayload.get("Authorization");

      if (!authorization) {
        logger.error("No authorization header", undefined, context);
        return new Response("No authorization header", { status: 400 });
      }

      // Log the raw body for debugging (remove in production)
      logger.info("Webhook body received", {
        ...context,
        bodyLength: body.length,
        bodyPreview: body.substring(0, 200),
        fullBody: body, // Log full body for debugging
      });

      // Verify webhook authenticity
      const event = await receiver.receive(body, authorization);
      
      logger.webhook(event.event, {
        ...context,
        eventType: event.event,
        ingressId: event.ingressInfo?.ingressId,
        roomName: event.room?.name,
        participantIdentity: event.participant?.identity,
      });

    // Handle different event types by sending to Inngest
    switch (event.event) {
      case "ingress_started":
        logger.info("Sending stream.started event to Inngest", {
          ...context,
          ingressId: event.ingressInfo?.ingressId,
        });
        await inngest.send({
          name: "livekit/stream.started",
          data: {
            ingressId: event.ingressInfo?.ingressId,
            timestamp: new Date().toISOString(),
          },
        });
        logger.info(`Sent stream.started event to Inngest`, {
          ...context,
          ingressId: event.ingressInfo?.ingressId,
        });
        break;

      case "ingress_ended":
        logger.info("Sending stream.ended event to Inngest", {
          ...context,
          ingressId: event.ingressInfo?.ingressId,
        });
        await inngest.send({
          name: "livekit/stream.ended",
          data: {
            ingressId: event.ingressInfo?.ingressId,
            timestamp: new Date().toISOString(),
          },
        });
        logger.info(`Sent stream.ended event to Inngest`, {
          ...context,
          ingressId: event.ingressInfo?.ingressId,
        });
        break;

      case "participant_joined":
        const roomNameJoined = event.room?.name;
        if (roomNameJoined) {
          await inngest.send({
            name: "livekit/participant.joined",
            data: {
              userId: roomNameJoined, // Room name is the userId
              participantIdentity: event.participant?.identity,
              participantSid: event.participant?.sid,
              timestamp: new Date().toISOString(),
            },
          });
          logger.info(`Sent participant.joined event to Inngest`, {
            ...context,
            userId: roomNameJoined,
            participantIdentity: event.participant?.identity,
          });
        }
        break;

      case "participant_left":
        const roomNameLeft = event.room?.name;
        if (roomNameLeft) {
          await inngest.send({
            name: "livekit/participant.left",
            data: {
              userId: roomNameLeft, // Room name is the userId
              participantIdentity: event.participant?.identity,
              participantSid: event.participant?.sid,
              timestamp: new Date().toISOString(),
            },
          });
          logger.info(`Sent participant.left event to Inngest`, {
            ...context,
            userId: roomNameLeft,
            participantIdentity: event.participant?.identity,
          });
        }
        break;

      default:
        logger.warn(`Unhandled event type: ${event.event}`, context);
    }

      logger.info("Webhook processed successfully", context);

      // Respond immediately - Inngest handles the rest!
      return new Response("Webhook processed", { status: 200 });
      
    } catch (error) {
      logger.error("Webhook processing failed", error as Error, context);
      
      // Even on error, respond quickly so LiveKit doesn't retry immediately
      return new Response("Webhook error", { status: 500 });
    }
  });
}