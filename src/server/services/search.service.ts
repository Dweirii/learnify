import { db } from "@/lib/db";
import { getSelf } from "@/server/services/auth.service";

export const getSearch = async (term?: string) => {
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
              },
            },
          },
        },
        OR: [
          {
            name: {
              contains: term,
            },
          },
          {
            user: {
              username: {
                contains: term,
              },
            }
          },
        ],
      },
      select: {
        user: true,
        id: true,
        name: true,
        isLive: true,
        thumbnailUrl: true,
        updatedAt: true,
      },
      orderBy: [
        {
          isLive: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
    });
  } else {
    streams = await db.stream.findMany({
      where: {
        OR: [
          {
            name: {
              contains: term,
            },
          },
          {
            user: {
              username: {
                contains: term,
              },
            }
          },
        ],
      },
      select: {
        user: true,
        id: true,
        name: true,
        isLive: true,
        thumbnailUrl: true,
        updatedAt: true,
      },
      orderBy: [
        {
          isLive: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
    });
  };

  return JSON.parse(JSON.stringify(streams.map(stream => ({
    id: stream.id,
    name: stream.name,
    thumbnailUrl: stream.thumbnailUrl,
    isLive: stream.isLive,
    updatedAt: stream.updatedAt.toISOString(),
    user: {
      id: stream.user.id,
      username: stream.user.username,
      imageUrl: stream.user.imageUrl,
      bio: stream.user.bio,
      createdAt: stream.user.createdAt.toISOString(),
      updatedAt: stream.user.updatedAt.toISOString(),
      externalUserId: stream.user.externalUserId,
    },
  }))));
};
