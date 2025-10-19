import { db } from "@/lib/db"
import { getSelf } from "@/server/services/auth.service"

export const getStreams = async () => {
  let userId;

  try {
    const self = await getSelf();
    userId = self.id;
  } catch {
    userId = null;
  }

  let streams = [];

  if (userId) {
    streams = await db.stream.findMany({
      where: {
        user: {
          NOT: {
            blocking: {
              some: {
                blockedId: userId,
              }
            }
          }
        }
      },
      select: {
        id: true,
        user: true,
        isLive: true,
        name: true,
        thumbnailUrl: true,
      },
      orderBy: [
        {
          isLive: "desc",
        },
        {
          updatedAt: "desc",
        }
      ],
    });
  } else {
    streams = await db.stream.findMany({
      select: {
        id: true,
        user: true,
        isLive: true,
        name: true,
        thumbnailUrl: true,
      },
      orderBy: [
        {
          isLive: "desc",
        },
        {
          updatedAt: "desc",
        }
      ]
    });
  }

  return JSON.parse(JSON.stringify(streams.map(stream => ({
    id: stream.id,
    user: {
      id: stream.user.id,
      username: stream.user.username,
      imageUrl: stream.user.imageUrl,
      bio: stream.user.bio,
      createdAt: stream.user.createdAt.toISOString(),
      updatedAt: stream.user.updatedAt.toISOString(),
      externalUserId: stream.user.externalUserId,
    },
    isLive: stream.isLive,
    name: stream.name,
    thumbnailUrl: stream.thumbnailUrl,
  }))));
};
