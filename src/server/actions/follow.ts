"use server";

import { revalidatePath } from "next/cache";
import { XPService } from "@/server/services/xp.service";
import { logger } from "@/lib/logger";

import { 
  followUser, 
  unfollowUser
} from "@/server/services/follow.service";

export const onFollow = async (id: string) => {
  try {
    const followedUser = await followUser(id);

    // Award XP for following someone
    if (followedUser) {
      try {
        console.log(`[Follow Action] Attempting to award XP to ${followedUser.followerId} for following ${followedUser.followingId}`);
        
        const result = await XPService.awardXP(
          followedUser.followerId,
          XPService.XP_CONSTANTS.FOLLOW_USER,
          "follow_user",
          {
            followedUserId: followedUser.followingId,
            followedUsername: followedUser.following.username,
          }
        );
        
        console.log(`[Follow Action] XP Award Result:`, result);
        logger.info(`[Follow] Awarded XP for follow: ${followedUser.followerId} → ${followedUser.followingId}`);
      } catch (error) {
        console.error(`[Follow Action] XP Award Failed:`, error);
        logger.error(`[Follow] Failed to award XP for follow:`, error as Error);
        // Don't throw - XP failure shouldn't break follow action
      }
    } else {
      console.log(`[Follow Action] No followedUser returned from followUser()`);
    }

    revalidatePath("/");

    if (followedUser) {
      revalidatePath(`/${followedUser.following.username}`);
    }

    return followedUser;
  } catch (error) {
    console.error("Follow error:", error);
    throw error;
  };
};

export const onUnfollow = async (id: string) => {
  try {
    const unfollowedUser = await unfollowUser(id);

    revalidatePath("/");

    if (unfollowedUser) {
      revalidatePath(`/${unfollowedUser.following.username}`)
    }

    return unfollowedUser;
  } catch (error) {
    console.error("Unfollow error:", error);
    throw error;
  }
}