import { headers } from "next/headers";
import { WebhookReceiver } from "livekit-server-sdk";

import { db } from "@/lib/db";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const authorization = headerPayload.get("Authorization");

  if (!authorization) {
    return new Response("No authorization header", { status: 400 });
  }

  const event = await receiver.receive(body, authorization);

  if (event.event === "ingress_started") {
    await db.stream.update({
      where: {
        ingressId: event.ingressInfo?.ingressId,
      },
      data: {
        isLive: true,
      },
    });
  }

  if (event.event === "ingress_ended") {
    await db.stream.update({
      where: {
        ingressId: event.ingressInfo?.ingressId,
      },
      data: {
        isLive: false,
        viewerCount: 0,
      },
    });
  }

  // Handle participant joined - use room name (which is the userId)
  if (event.event === "participant_joined") {
    const roomName = event.room?.name;
    
    if (roomName) {
      await db.stream.update({
        where: {
          userId: roomName,
        },
        data: {
          viewerCount: {
            increment: 1,
          },
        },
      });
    }
  }

  // Handle participant left - use room name (which is the userId)
  if (event.event === "participant_left") {
    const roomName = event.room?.name;
    
    if (roomName) {
      const stream = await db.stream.findUnique({
        where: { userId: roomName },
        select: { id: true, viewerCount: true },
      });
      
      if (stream && stream.viewerCount > 0) {
        await db.stream.update({
          where: { id: stream.id },
          data: {
            viewerCount: {
              decrement: 1,
            },
          },
        });
      }
    }
  }

  return new Response("Webhook processed", { status: 200 });
}