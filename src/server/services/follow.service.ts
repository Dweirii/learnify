import { db } from "@/lib/db";
import { getSelf } from "@/server/services/auth.service";

export const getFollowedUsers = async () => {
  try {
    const self = await getSelf();

    const followedUsers = await db.follow.findMany({
      where: {
        followerId: self.id,
        following: {
          blocking: {
            none: {
              blockedId: self.id,
            },
          },
        },
      },
      include: {
        following: {
          include: {
            stream: {
              select: {
                isLive: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          following: {
            stream: {
              isLive: "desc",
            },
          },
        },
        {
          createdAt: "desc"
        },
      ]
    });

    return JSON.parse(JSON.stringify(followedUsers.map(follow => ({
      id: follow.id,
      followerId: follow.followerId,
      followingId: follow.followingId,
      createdAt: follow.createdAt.toISOString(),
      updatedAt: follow.createdAt.toISOString(), // Follow model doesn't have updatedAt, using createdAt
      following: {
        id: follow.following.id,
        username: follow.following.username,
        imageUrl: follow.following.imageUrl,
        bio: follow.following.bio,
        createdAt: follow.following.createdAt.toISOString(),
        updatedAt: follow.following.updatedAt.toISOString(),
        externalUserId: follow.following.externalUserId,
        stream: follow.following.stream ? {
          isLive: follow.following.stream.isLive,
        } : null,
      },
    }))));
  } catch {
    return [];
  }
};

export const isFollowingUser = async (id: string) => {
  try {
    const self = await getSelf();

    const otherUser = await db.user.findUnique({
      where: { id },
    });

    if (!otherUser) {
      throw new Error("User not found");
    }

    if (otherUser.id === self.id) {
      return true;
    }

    const existingFollow = await db.follow.findFirst({
      where: {
        followerId: self.id,
        followingId: otherUser.id,
      },
    });

    return !!existingFollow;
  } catch {
    return false;
  }
};

export const followUser = async (id: string) => {
  const self = await getSelf();

  const otherUser = await db.user.findUnique({
    where: { id },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  if (otherUser.id === self.id) {
    throw new Error("Cannot follow yourself");
  }

  const existingFollow = await db.follow.findFirst({
    where: {
      followerId: self.id,
      followingId: otherUser.id,
    },
  });

  if (existingFollow) {
    throw new Error("Already following");
  }

  const follow = await db.follow.create({
    data: {
      followerId: self.id,
      followingId: otherUser.id,
    },
    include: {
      following: true,
      follower: true,
    },
  });

  return {
    id: follow.id,
    followerId: follow.followerId,
    followingId: follow.followingId,
    createdAt: follow.createdAt.toISOString(),
    following: {
      id: follow.following.id,
      username: follow.following.username,
      imageUrl: follow.following.imageUrl,
      bio: follow.following.bio,
      createdAt: follow.following.createdAt.toISOString(),
      updatedAt: follow.following.updatedAt.toISOString(),
      externalUserId: follow.following.externalUserId,
    },
    follower: {
      id: follow.follower.id,
      username: follow.follower.username,
      imageUrl: follow.follower.imageUrl,
      bio: follow.follower.bio,
      createdAt: follow.follower.createdAt.toISOString(),
      updatedAt: follow.follower.updatedAt.toISOString(),
      externalUserId: follow.follower.externalUserId,
    },
  };
};

export const unfollowUser = async (id: string) => {
  const self = await getSelf();

  const otherUser = await db.user.findUnique({
    where: {
      id,
    },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  if (otherUser.id === self.id) {
    throw new Error("Cannot unfollow yourself");
  }

  const existingFollow = await db.follow.findFirst({
    where: {
      followerId: self.id,
      followingId: otherUser.id,
    },
  });

  if (!existingFollow) {
    throw new Error("Not following");
  }

  const follow = await db.follow.delete({
    where: {
      id: existingFollow.id,
    },
    include: {
      following: true,
    },
  });

  return {
    id: follow.id,
    followerId: follow.followerId,
    followingId: follow.followingId,
    createdAt: follow.createdAt.toISOString(),
    following: {
      id: follow.following.id,
      username: follow.following.username,
      imageUrl: follow.following.imageUrl,
      bio: follow.following.bio,
      createdAt: follow.following.createdAt.toISOString(),
      updatedAt: follow.following.updatedAt.toISOString(),
      externalUserId: follow.following.externalUserId,
    },
  };
};
