import { db } from "@/lib/db"
import { getSelf } from "@/server/services/auth.service"
import type { StreamCategory } from "@prisma/client";

export const getLiveStreamsByCategory = async (
  category: StreamCategory,
  params?: { take?: number; cursor?: { updatedAt: string; id: string } }
) => {
  const take = params?.take ?? 20;

  let userId: string | null = null;

  try {
    const self = await getSelf();
    userId = self.id;
  } catch {
    userId = null;
  }

  const where = {
    isLive: true,
    category,
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
  };

  const orderBy = [{ updatedAt: "desc" as const }, { id: "desc" as const }];

  const streams = await db.stream.findMany({
    where,
    select: {
      id: true,
      name: true,
      isLive: true,
      thumbnailUrl: true,
      category: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          imageUrl: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          externalUserId: true,
        },
      },
    },
    orderBy,
    take,
    ...(params?.cursor && {
      cursor: params.cursor, // Use correct cursor type compatible with StreamWhereUniqueInput
      skip: 1,
    }),
  });

  // Serialize dates for RSC boundaries
  return streams.map((s) => ({
    id: s.id,
    name: s.name,
    isLive: s.isLive,
    thumbnailUrl: s.thumbnailUrl,
    category: s.category,
    user: {
      id: s.user.id,
      username: s.user.username,
      imageUrl: s.user.imageUrl,
      bio: s.user.bio,
      createdAt: s.user.createdAt,
      updatedAt: s.user.updatedAt,
      externalUserId: s.user.externalUserId,
    },
    updatedAt: s.updatedAt,
  }));
};

// Batch fetch top N live streams per category for homepage rows
export const getLiveStreamsGroupedByCategory = async (
  categories: StreamCategory[],
  takePerCategory = 12
) => {
  const results = await Promise.all(
    categories.map((category) =>
      getLiveStreamsByCategory(category, { take: takePerCategory })
    )
  );

  const grouped = new Map<StreamCategory, ReturnType<typeof Object>>();
  categories.forEach((c, i) => {
    grouped.set(c, results[i]);
  });

  return grouped;
};