import { db } from "@/lib/db";
export const getStreamByUserId = async (userId: string) => {
  const stream = await db.stream.findUnique({ where: { userId } });
  if (!stream) return null;

  return JSON.parse(JSON.stringify({
    id: stream.id,
    name: stream.name,
    thumbnailUrl: stream.thumbnailUrl,
    isLive: stream.isLive,
    isChatEnabled: stream.isChatEnabled,
    isChatDelayed: stream.isChatDelayed,
    isChatFollowersOnly: stream.isChatFollowersOnly,
    createdAt: stream.createdAt.toISOString(),
    updatedAt: stream.updatedAt.toISOString(),
    userId: stream.userId,
    ingressId: stream.ingressId,
    serverUrl: stream.serverUrl,
    streamKey: stream.streamKey,
  }));
};
