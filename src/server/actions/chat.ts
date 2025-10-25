"use server";

import { redis } from "@/lib/redis";

interface PinnedMessageData {
  messageId: string;
  message: string;
  from: {
    name: string;
    identity: string;
  };
  timestamp: number;
}

/**
 * Pin a message for a specific stream
 * Stores the pinned message in Redis (ephemeral - 24 hours)
 */
export const pinMessage = async (
  streamId: string, 
  messageId: string, 
  messageData: PinnedMessageData
) => {
  try {
    const key = `pinned_message:${streamId}`;
    const pinnedData = {
      messageId,
      messageData,
      timestamp: Date.now(),
    };
    
    // Store for 24 hours
    await redis.setex(key, 86400, JSON.stringify(pinnedData));
    return { success: true, data: pinnedData };
  } catch (error) {
    console.error("Error pinning message:", error);
    return { success: false, error: "Failed to pin message" };
  }
};

/**
 * Unpin a message for a specific stream
 */
export const unpinMessage = async (streamId: string) => {
  try {
    const key = `pinned_message:${streamId}`;
    await redis.del(key);
    return { success: true };
  } catch (error) {
    console.error("Error unpinning message:", error);
    return { success: false, error: "Failed to unpin message" };
  }
};

/**
 * Get pinned message for a specific stream
 * Returns null if no message is pinned
 */
export const getPinnedMessage = async (streamId: string) => {
  try {
    const key = `pinned_message:${streamId}`;
    const data = await redis.get(key);
    
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return parsed.messageData || null;
  } catch (error) {
    console.error("Error getting pinned message:", error);
    return null;
  }
};
