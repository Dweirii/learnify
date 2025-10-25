import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { XPService } from "@/server/services/xp.service";
import { LeaderboardService } from "@/server/services/leaderboard.service";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";

/**
 * GET /api/xp
 * 
 * Requires authentication
 * Returns user's XP stats, level, rank, and progress
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { externalUserId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch user stats
    const stats = await XPService.getUserStats(dbUser.id);

    if (!stats) {
      return NextResponse.json(
        { error: "Stats not found" },
        { status: 404 }
      );
    }

    // Fetch user rank
    const rank = await LeaderboardService.getUserRank(dbUser.id);

    // Calculate progress to next level
    const progress = XPService.calculateLevelProgress(stats.totalXP, stats.level);

    return NextResponse.json(
      {
        userId: dbUser.id,
        totalXP: stats.totalXP,
        level: stats.level,
        rank: rank,
        progress: {
          current: progress.currentXP,
          required: progress.xpForNextLevel,
          percentage: progress.progressPercentage,
        },
        stats: {
          streamMinutes: stats.streamMinutes,
          watchMinutes: stats.watchMinutes,
          chatMessageCount: stats.chatMessageCount,
        },
        lastXPUpdate: stats.lastXPUpdate,
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    logger.error("[API] Failed to fetch XP stats:", error as Error);
    return NextResponse.json(
      { error: "Failed to fetch XP stats" },
      { status: 500 }
    );
  }
}

