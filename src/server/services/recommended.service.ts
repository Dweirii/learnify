import { db } from "@/lib/db";
import { getSelf } from "@/server/services/auth.service";

export const getRecommended = async () => {
  let userId;

  try {
    const self = await getSelf();
    userId = self.id;
  } catch {
    userId = null;
  }

  let users = [];

  if (userId) {
    users = await db.user.findMany({
      where: {
        AND: [
          {
            NOT: {
              id: userId,
            },
          },
          {
            NOT: {
              followedBy: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
          {
            NOT: {
              blocking: {
                some: {
                  blockedId: userId,
                },
              },
            },
          },
        ],
      },
      include: {
        stream: {
          select: {
            isLive: true,
          },
        },
      },
      orderBy: [
        {
          stream: {
            isLive: "desc",
          }
        },
        {
          createdAt: "desc"
        },
      ]
    })
  } else {
    users = await db.user.findMany({
      include: {
        stream: {
          select: {
            isLive: true,
          },
        },
      },
      orderBy: [
        {
          stream: {
            isLive: "desc",
          }
        },
        {
          createdAt: "desc"
        },
      ]
    });
  }

  return JSON.parse(JSON.stringify(users.map(user => ({
    id: user.id,
    username: user.username,
    imageUrl: user.imageUrl,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    externalUserId: user.externalUserId,
    stream: user.stream ? {
      isLive: user.stream.isLive,
    } : null,
  }))));
};
