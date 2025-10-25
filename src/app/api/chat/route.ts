import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { XPService } from "@/server/services/xp.service";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";

/**
 * POST /api/chat
 * 
 * Awards XP for chat messages
 * Called after a user sends a chat message
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { streamId, messageId } = body;

    if (!streamId || !messageId) {
      return NextResponse.json(
        { error: "streamId and messageId are required" },
        { status: 400 }
      );
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { externalUserId: user.id },
      select: { id: true, username: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check daily chat XP limit
    const dailyKey = `chat_xp_daily:${dbUser.id}:${new Date().toISOString().split('T')[0]}`;
    const dailyCount = await redis.get(dailyKey);
    const currentCount = dailyCount ? parseInt(dailyCount) : 0;
    
    const MAX_DAILY_CHAT_XP = 50; // Max 50 XP per day from chat
    
    if (currentCount >= MAX_DAILY_CHAT_XP) {
      return NextResponse.json(
        { 
          success: true,
          xpAwarded: 0,
          message: "Daily chat XP limit reached",
          dailyCount: currentCount,
          dailyLimit: MAX_DAILY_CHAT_XP,
        }
      );
    }

    // Award XP for chat message
    const result = await XPService.awardXP(
      dbUser.id,
      XPService.XP_CONSTANTS.CHAT_MESSAGE,
      "chat_message",
      {
        streamId,
        messageId,
        dailyCount: currentCount + 1,
      }
    );

    if (result.success) {
      // Update daily count
      await redis.setex(dailyKey, 86400, (currentCount + 1).toString());
      
      logger.info(`[Chat] Awarded XP for chat message: ${dbUser.username} (${currentCount + 1}/${MAX_DAILY_CHAT_XP} daily)`);

      return NextResponse.json({
        success: true,
        xpAwarded: XPService.XP_CONSTANTS.CHAT_MESSAGE,
        leveledUp: result.newLevel !== result.oldLevel,
        newLevel: result.newLevel,
        oldLevel: result.oldLevel,
        dailyCount: currentCount + 1,
        dailyLimit: MAX_DAILY_CHAT_XP,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to award XP" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("[Chat] Failed to award XP for chat message:", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

