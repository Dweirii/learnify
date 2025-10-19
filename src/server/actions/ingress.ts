"use server";

import {
  IngressInput,
  IngressClient,
  RoomServiceClient,
  type CreateIngressOptions,
} from "livekit-server-sdk";

import { db } from "@/lib/db";
import { getSelf } from "@/server/services/auth.service";
import { revalidatePath } from "next/cache";

// ✅ Initialize LiveKit clients (server-only)
const roomService = new RoomServiceClient(
  process.env.LIVEKIT_API_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!,
);

const ingressClient = new IngressClient(process.env.LIVEKIT_API_URL!);

// ✅ Reset old ingresses before creating a new one
export const resetIngresses = async (hostIdentity: string) => {
  const ingresses = await ingressClient.listIngress({
    roomName: hostIdentity,
  });

  const rooms = await roomService.listRooms([hostIdentity]);

  for (const room of rooms) {
    await roomService.deleteRoom(room.name);
  }

  for (const ingress of ingresses) {
    if (ingress.ingressId) {
      await ingressClient.deleteIngress(ingress.ingressId);
    }
  }
};

// ✅ Safely map client input to real LiveKit enum values
const resolveIngressType = (value: string | number): IngressInput => {
  if (value === "1" || value === 1 || value === "RTMP_INPUT") {
    return IngressInput.RTMP_INPUT;
  }
  if (value === "2" || value === 2 || value === "WHIP_INPUT") {
    return IngressInput.WHIP_INPUT;
  }
  throw new Error("Invalid ingress type");
};

// ✅ Main action
export const createIngress = async (ingressType: string | number) => {
  const self = await getSelf();

  await resetIngresses(self.id);

  const type = resolveIngressType(ingressType);

  const options: CreateIngressOptions = {
    name: self.username,
    roomName: self.id,
    participantName: self.username,
    participantIdentity: self.id,
  };

  // Enable WHIP optimization if applicable
  if (type === IngressInput.WHIP_INPUT) {
    options.bypassTranscoding = true;
  }

  // 🧠 Create ingress
  const ingress = await ingressClient.createIngress(type, options);

  if (!ingress || !ingress.url || !ingress.streamKey) {
    console.error("Invalid ingress response:", ingress);
    throw new Error("Failed to create ingress: missing URL or streamKey");
  }

  // 🗃️ Update stream info in DB
  await db.stream.update({
    where: { userId: self.id },
    data: {
      ingressId: ingress.ingressId,
      serverUrl: ingress.url,
      streamKey: ingress.streamKey,
    },
  });

  revalidatePath(`/u/${self.username}/keys`);

  return {
    ingressId: ingress.ingressId,
    serverUrl: ingress.url,
    streamKey: ingress.streamKey,
  };
};
