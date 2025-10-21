import { db } from "@/lib/db"

export const getUserByUsername = async (username: string) => {
  const user = await db.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      externalUserId: true,
      username: true,
      bio: true,
      imageUrl: true,
      stream: {
        select: {
          id: true,
          isLive: true,
          isChatDelayed: true,
          isChatEnabled: true,
          isChatFollowersOnly: true,
          thumbnailUrl: true,
          name: true,
          viewerCount: true,
        },
      },
      _count: {
        select: {
          followedBy: true,
        },
      },
    },
  });

  return user ? JSON.parse(JSON.stringify({
    id: user.id,
    externalUserId: user.externalUserId,
    username: user.username,
    bio: user.bio,
    imageUrl: user.imageUrl,
    stream: user.stream ? {
      id: user.stream.id,
      isLive: user.stream.isLive,
      isChatDelayed: user.stream.isChatDelayed,
      isChatEnabled: user.stream.isChatEnabled,
      isChatFollowersOnly: user.stream.isChatFollowersOnly,
      thumbnailUrl: user.stream.thumbnailUrl,
      name: user.stream.name,
      viewerCount: user.stream.viewerCount,
    } : null,
    _count: {
      followedBy: user._count.followedBy,
    },
  })) : null;
};

export const getUserById = async (id: string) => {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      stream: true,
    },
  });

  return user ? JSON.parse(JSON.stringify({
    id: user.id,
    externalUserId: user.externalUserId,
    username: user.username,
    bio: user.bio,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    stream: user.stream ? {
      id: user.stream.id,
      name: user.stream.name,
      thumbnailUrl: user.stream.thumbnailUrl,
      isLive: user.stream.isLive,
      isChatEnabled: user.stream.isChatEnabled,
      isChatDelayed: user.stream.isChatDelayed,
      isChatFollowersOnly: user.stream.isChatFollowersOnly,
      createdAt: user.stream.createdAt.toISOString(),
      updatedAt: user.stream.updatedAt.toISOString(),
      userId: user.stream.userId,
      ingressId: user.stream.ingressId,
      serverUrl: user.stream.serverUrl,
      streamKey: user.stream.streamKey,
    } : null,
  })) : null;
};
