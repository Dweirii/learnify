import { db } from "@/lib/db"
import { getSelf } from "@/server/services/auth.service"
import type { StreamCategory } from "@prisma/client";
import type { HomeStreamResult } from "@/types";

export const getLiveStreamsByCategory = async (
  category: StreamCategory,
  params?: { take?: number; page?: number }
): Promise<HomeStreamResult[]> => {
  const take = params?.take ?? 24;
  const page = params?.page ?? 1;
  const skip = (page - 1) * take;

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

  const streams = await db.stream.findMany({
    where,
    select: {
      id: true,
      name: true,
      isLive: true,
      thumbnailUrl: true,
      category: true,
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
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take,
    skip,
  });

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
  }));
};

// Batch fetch top N live streams per category for homepage rows
export const getLiveStreamsGroupedByCategory = async (
  categories: StreamCategory[],
  takePerCategory = 12
): Promise<Map<StreamCategory, HomeStreamResult[]>> => {
  const results = await Promise.all(
    categories.map((category) =>
      getLiveStreamsByCategory(category, { take: takePerCategory, page: 1 })
    )
  );

  const grouped = new Map<StreamCategory, HomeStreamResult[]>();
  categories.forEach((c, i) => {
    grouped.set(c as StreamCategory, results[i]);
  });

  return grouped;
};