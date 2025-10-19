import { currentUser } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

export const getSelf = async () => {
  const self = await currentUser();

  if (!self || !self.username) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { externalUserId: self.id },
  });

  if (!user) {
    throw new Error("Not found");
  }

  return JSON.parse(JSON.stringify({
    id: user.id,
    username: user.username,
    imageUrl: user.imageUrl,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    externalUserId: user.externalUserId,
  }));
};

export const getSelfByUsername = async (username: string) => {
  const self = await currentUser();

  if (!self || !self.username) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { username }
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (self.username !== user.username) {
    throw new Error("Unauthorized");
  }

  return JSON.parse(JSON.stringify({
    id: user.id,
    username: user.username,
    imageUrl: user.imageUrl,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    externalUserId: user.externalUserId,
  }));
};
