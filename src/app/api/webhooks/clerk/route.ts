import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { resetIngresses } from "@/server/actions/ingress";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) throw new Error("Missing Clerk Webhook Secret");

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const payload = JSON.parse(body);
  const eventType = evt.type;

  console.log("📨 Webhook received:", eventType);

  const externalId = payload.data.id;
  const username = payload.data.username;
  const imageUrl = payload.data.image_url;

  console.log("👤 User data:", { externalId, username, imageUrl });

  if (eventType === "user.created") {
    console.log("🆕 Creating new user...");

    const existingUser = await db.user.findUnique({
      where: { externalUserId: externalId },
    });

    if (!existingUser) {
      await db.user.create({
        data: {
          externalUserId: externalId,
          username,
          imageUrl,
           stream: {
             create: {
               name: `${username}'s Stream`,
             },
           },
        },
      });
      console.log("✅ User created successfully");
    } else {
      console.log("ℹ️ User already exists");
    }
  }

  if (eventType === "user.updated") {
    const existingUser = await db.user.findUnique({
      where: { externalUserId: externalId },
    });

    if (!existingUser) {
      await db.user.create({
        data: {
          externalUserId: externalId,
          username,
          imageUrl,
        },
      });
    } else {
      await db.user.update({
        where: { externalUserId: externalId },
        data: {
          username,
          imageUrl,
        },
      });
    }
  }

  if (eventType === "user.deleted") {
    await resetIngresses(externalId);
    await db.user.deleteMany({
      where: { externalUserId: externalId },
    });
  }

  return new Response("✅ Webhook processed", { status: 200 });
}
