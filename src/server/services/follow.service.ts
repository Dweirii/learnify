import { db } from "@/lib/db";
import { getSelf } from "@/server/services/auth.service";

// Cache for user lookups to avoid redundant queries
const userCache = new Map<string, { user: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to get cached user or fetch from DB
async function getCachedUser(id: string) {
  const cached = userCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  
  const user = await db.user.findUnique({ where: { id } });
  if (user) {
    userCache.set(id, { user, timestamp: Date.now() });
  }
  return user;
}

// Optimized query using raw SQL for complex joins
export const getFollowedUsers = async () => {
  try {
    const self = await getSelf();

    // Use raw SQL for optimal performance with complex joins
    const followedUsers = await db.$queryRaw`
      SELECT 
        f.id,
        f."followerId",
        f."followingId",
        f."createdAt",
        f."updatedAt",
        u.id as user_id,
        u.username,
        u."imageUrl",
        u.bio,
        u."createdAt" as user_created_at,
        u."updatedAt" as user_updated_at,
        u."externalUserId",
        s.id as stream_id,
        s."isLive",
        s."viewerCount"
      FROM "Follow" f
      INNER JOIN "User" u ON f."followingId" = u.id
      LEFT JOIN "Stream" s ON u.id = s."userId"
      WHERE f."followerId" = ${self.id}
        AND NOT EXISTS (
          SELECT 1 FROM "Block" b 
          WHERE b."blockerId" = u.id 
            AND b."blockedId" = ${self.id}
        )
      ORDER BY 
        s."isLive" DESC NULLS LAST,
        f."createdAt" DESC
    ` as Array<{
      id: string;
      followerId: string;
      followingId: string;
      createdAt: Date;
      updatedAt: Date;
      user_id: string;
      username: string;
      imageUrl: string;
      bio: string | null;
      user_created_at: Date;
      user_updated_at: Date;
      externalUserId: string;
      stream_id: string | null;
      isLive: boolean | null;
      viewerCount: number | null;
    }>;

    // Transform to expected format efficiently
    return followedUsers.map(follow => ({
      id: follow.id,
      followerId: follow.followerId,
      followingId: follow.followingId,
      createdAt: follow.createdAt.toISOString(),
      updatedAt: follow.updatedAt.toISOString(),
      following: {
        id: follow.user_id,
        username: follow.username,
        imageUrl: follow.imageUrl,
        bio: follow.bio,
        createdAt: follow.user_created_at.toISOString(),
        updatedAt: follow.user_updated_at.toISOString(),
        externalUserId: follow.externalUserId,
        stream: follow.stream_id ? {
          isLive: follow.isLive || false,
          viewerCount: follow.viewerCount || 0,
          id: follow.stream_id,
        } : null,
      },
    }));
  } catch {
    return [];
  }
};

export const isFollowingUser = async (id: string) => {
  try {
    const self = await getSelf();

    // Self-follow check
    if (id === self.id) {
      return true;
    }

    // Optimized single query with EXISTS for better performance
    const result = await db.$queryRaw`
      SELECT EXISTS(
        SELECT 1 FROM "Follow" 
        WHERE "followerId" = ${self.id} 
          AND "followingId" = ${id}
      ) as is_following
    ` as Array<{ is_following: boolean }>;

    return result[0]?.is_following || false;
  } catch {
    return false;
  }
};

export const followUser = async (id: string) => {
  const self = await getSelf();

  // Self-follow check
  if (id === self.id) {
    throw new Error("Cannot follow yourself");
  }

  // Use cached user lookup
  const otherUser = await getCachedUser(id);
  if (!otherUser) {
    throw new Error("User not found");
  }

  // Optimized upsert operation - handles both create and duplicate cases
  try {
    const follow = await db.follow.create({
      data: {
        followerId: self.id,
        followingId: otherUser.id as string,
      },
      include: {
        following: {
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
        follower: {
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
    });

    // Get the user data separately to ensure we have the correct types
    const followingUser = await getCachedUser(otherUser.id as string);
    const followerUser = await getCachedUser(self.id);

    if (!followingUser || !followerUser) {
      throw new Error("User data not found");
    }

    return {
      id: follow.id,
      followerId: follow.followerId,
      followingId: follow.followingId,
      createdAt: follow.createdAt.toISOString(),
      following: {
        id: followingUser.id,
        username: followingUser.username,
        imageUrl: followingUser.imageUrl,
        bio: followingUser.bio,
        createdAt: (followingUser.createdAt as Date).toISOString(),
        updatedAt: (followingUser.updatedAt as Date).toISOString(),
        externalUserId: followingUser.externalUserId,
      },
      follower: {
        id: followerUser.id,
        username: followerUser.username,
        imageUrl: followerUser.imageUrl,
        bio: followerUser.bio,
        createdAt: (followerUser.createdAt as Date).toISOString(),
        updatedAt: (followerUser.updatedAt as Date).toISOString(),
        externalUserId: followerUser.externalUserId,
      },
    };
  } catch (error: unknown) {
    // Handle unique constraint violation (already following)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new Error("Already following");
    }
    throw error;
  }
};

export const unfollowUser = async (id: string) => {
  const self = await getSelf();

  // Self-unfollow check
  if (id === self.id) {
    throw new Error("Cannot unfollow yourself");
  }

  // Optimized single query with DELETE RETURNING for better performance
  const result = await db.$queryRaw`
    DELETE FROM "Follow" 
    WHERE "followerId" = ${self.id} 
      AND "followingId" = ${id}
    RETURNING 
      id,
      "followerId",
      "followingId",
      "createdAt"
  ` as Array<{
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Date;
  }>;

  if (result.length === 0) {
    throw new Error("Not following");
  }

  const deletedFollow = result[0];
  
  // Get user data efficiently
  const otherUser = await getCachedUser(id);
  if (!otherUser) {
    throw new Error("User not found");
  }

  return {
    id: deletedFollow.id,
    followerId: deletedFollow.followerId,
    followingId: deletedFollow.followingId,
    createdAt: deletedFollow.createdAt.toISOString(),
    following: {
      id: otherUser.id,
      username: otherUser.username,
      imageUrl: otherUser.imageUrl,
      bio: otherUser.bio,
      createdAt: (otherUser.createdAt as Date).toISOString(),
      updatedAt: (otherUser.updatedAt as Date).toISOString(),
      externalUserId: otherUser.externalUserId,
    },
  };
};

// Additional optimized functions for bulk operations
export const getFollowStats = async (userId: string) => {
  try {
    const result = await db.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "Follow" WHERE "followerId" = ${userId}) as followers_count,
        (SELECT COUNT(*) FROM "Follow" WHERE "followingId" = ${userId}) as following_count
    ` as Array<{
      followers_count: bigint;
      following_count: bigint;
    }>;

    return {
      followersCount: Number(result[0]?.followers_count || 0),
      followingCount: Number(result[0]?.following_count || 0),
    };
  } catch {
    return { followersCount: 0, followingCount: 0 };
  }
};

// Batch follow/unfollow operations for better performance
export const batchFollowUsers = async (userIds: string[]) => {
  const self = await getSelf();
  
  if (userIds.length === 0) return [];
  
  // Remove self from the list
  const validUserIds = userIds.filter(id => id !== self.id);
  
  if (validUserIds.length === 0) return [];

  try {
    // Use raw SQL for bulk insert with conflict handling
    const result = await db.$queryRaw`
      INSERT INTO "Follow" ("followerId", "followingId", "createdAt", "updatedAt")
      SELECT ${self.id}, unnest(${validUserIds}::text[]), NOW(), NOW()
      ON CONFLICT ("followerId", "followingId") DO NOTHING
      RETURNING "followingId"
    ` as Array<{ followingId: string }>;

    return result.map(r => r.followingId);
  } catch {
    return [];
  }
};

// Cache cleanup utility
export const clearUserCache = () => {
  userCache.clear();
};

// Periodic cache cleanup (call this from a cron job or background task)
export const cleanupExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
};



