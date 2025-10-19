import { db } from "@/lib/db";
import { getSelf } from "@/server/services/auth.service";

export const isBlockedByUser = async (id: string) => {
  try {
    const self = await getSelf();

    const otherUser = await db.user.findUnique({
      where: { id }
    });

    if (!otherUser) {
      throw new Error("User not found");
    }

    if (otherUser.id === self.id) {
      return false;
    }

    const existingBlock = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: otherUser.id,
          blockedId: self.id,
        },
      },
    });

    return !!existingBlock;
  } catch {
    return false;
  }
};

export const blockUser = async (id: string) => {
  const self = await getSelf();

  if (self.id === id) {
    throw new Error("Cannot block yourself");
  }

  const otherUser = await db.user.findUnique({
    where: { id }
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  const existingBlock = await db.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: self.id,
        blockedId: otherUser.id,
      },
    },
  });

  if (existingBlock) {
    throw new Error("Already blocked");
  }

  const block = await db.block.create({
    data: {
      blockerId: self.id,
      blockedId: otherUser.id,
    },
    include: {
      blocked: true,
    },
  });

  return {
    id: block.id,
    blockerId: block.blockerId,
    blockedId: block.blockedId,
    blocked: {
      id: block.blocked.id,
      username: block.blocked.username,
      imageUrl: block.blocked.imageUrl,
      bio: block.blocked.bio,
      createdAt: block.blocked.createdAt.toISOString(),
      updatedAt: block.blocked.updatedAt.toISOString(),
      externalUserId: block.blocked.externalUserId,
    },
  };
};

export const unblockUser = async (id: string) => {
  const self = await getSelf();

  if (self.id === id) {
    throw new Error("Cannot unblock yourself");
  }

  const otherUser = await db.user.findUnique({
    where: { id },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  const existingBlock = await db.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: self.id,
        blockedId: otherUser.id,
      },
    },
  });

  if (!existingBlock) {
    throw new Error("Not blocked");
  }

  const unblock = await db.block.delete({
    where: {
      id: existingBlock.id,
    },
    include: {
      blocked: true,
    },
  });

  return {
    id: unblock.id,
    blockerId: unblock.blockerId,
    blockedId: unblock.blockedId,
    blocked: {
      id: unblock.blocked.id,
      username: unblock.blocked.username,
      imageUrl: unblock.blocked.imageUrl,
      bio: unblock.blocked.bio,
      createdAt: unblock.blocked.createdAt.toISOString(),
      updatedAt: unblock.blocked.updatedAt.toISOString(),
      externalUserId: unblock.blocked.externalUserId,
    },
  };
};

export const getBlockedUsers = async () => {
  const self = await getSelf();

  const blockedUsers = await db.block.findMany({
    where: {
      blockerId: self.id,
    },
    include: {
      blocked: true,
    },
  });

  return blockedUsers.map(block => ({
    id: block.id,
    blockerId: block.blockerId,
    blockedId: block.blockedId,
    blocked: {
      id: block.blocked.id,
      username: block.blocked.username,
      imageUrl: block.blocked.imageUrl,
      bio: block.blocked.bio,
      createdAt: block.blocked.createdAt.toISOString(),
      updatedAt: block.blocked.updatedAt.toISOString(),
      externalUserId: block.blocked.externalUserId,
    },
  }));
};
