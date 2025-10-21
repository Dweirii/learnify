import { db } from "@/lib/db";
import { getSelf } from "@/server/services/auth.service";

export const getTopLiveStream = async () => {
  let userId: string | null = null;

  try {
    const self = await getSelf();
    userId = self.id;
  } catch {
    userId = null;
  }

  const stream = await db.stream.findFirst({
    where: {
      isLive: true,
      viewerCount: {
        gt: 0, // Only show streams with at least 1 viewer
      },
      ...(userId && {
        user: {
          NOT: {
            blocking: {
              some: {
                blockedId: userId,
              },
            },
          },
        },
      }),
    },
    select: {
      id: true,
      name: true,
      thumbnailUrl: true,
      isLive: true,
      category: true,
      viewerCount: true,
      user: {
        select: {
          id: true,
          username: true,
          imageUrl: true,
          bio: true,
          externalUserId: true,
        },
      },
    },
    orderBy: {
      viewerCount: "desc",
    },
  });

  if (!stream) {
    return null;
  }
  console.log("🔍 getTopLiveStream result:", stream?.user?.bio);

  return stream;
};