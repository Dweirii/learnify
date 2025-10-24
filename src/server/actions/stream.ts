"use server";

import { Stream, StreamCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getSelf } from "@/server/services/auth.service";

export const updateStream = async (values: Partial<Stream>) => {
  try {
    console.log("Update stream called with values:", values);
    
    const self = await getSelf();
    const selfStream = await db.stream.findUnique({
      where: {
        userId: self.id,
      },
    });

    if (!selfStream) {
      throw new Error("Stream not found");
    }

    // Validate category if provided
    if (values.category && !Object.values(StreamCategory).includes(values.category as StreamCategory)) {
      console.error("Invalid category:", values.category);
      throw new Error(`Invalid category: ${values.category}. Must be one of: ${Object.values(StreamCategory).join(', ')}`);
    }

    // Validate name if provided
    if (values.name !== undefined) {
      if (typeof values.name !== 'string' || values.name.trim().length < 3) {
        throw new Error("Stream name must be at least 3 characters");
      }
      if (values.name.length > 100) {
        throw new Error("Stream name must be less than 100 characters");
      }
    }

    const validData: Partial<Stream> = {};
    
    // Only include fields that are provided and valid
    if (values.thumbnailUrl !== undefined) validData.thumbnailUrl = values.thumbnailUrl;
    if (values.name !== undefined) validData.name = values.name.trim();
    if (values.category !== undefined) validData.category = values.category as StreamCategory;
    if (values.isChatEnabled !== undefined) validData.isChatEnabled = values.isChatEnabled;
    if (values.isChatFollowersOnly !== undefined) validData.isChatFollowersOnly = values.isChatFollowersOnly;
    if (values.isChatDelayed !== undefined) validData.isChatDelayed = values.isChatDelayed;

    console.log("Updating stream with valid data:", validData);

    const stream = await db.stream.update({
      where: {
        id: selfStream.id,
      },
      data: validData,
    });

    revalidatePath(`/u/${self.username}/settings`);
    revalidatePath(`/u/${self.username}`);
    revalidatePath(`/${self.username}`);

    console.log("Stream updated successfully:", stream);
    return stream;
  } catch (error) {
    console.error("Update stream error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update stream");
  };
};
