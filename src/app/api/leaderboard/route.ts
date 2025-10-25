import { NextRequest, NextResponse } from "next/server";
import { LeaderboardService } from "@/server/services/leaderboard.service";
import { logger } from "@/lib/logger";

/**
 * GET /api/leaderboard
 * 
 * Query params:
 * - type: 'global' | 'weekly' | 'monthly'
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "global";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validate parameters
    if (!["global", "weekly", "monthly"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'global', 'weekly', or 'monthly'" },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: "Offset must be >= 0" },
        { status: 400 }
      );
    }

    // Fetch leaderboard data
    let result;
    
    switch (type) {
      case "global":
        result = await LeaderboardService.getGlobalLeaderboard(limit, offset);
        break;
      case "weekly":
        result = await LeaderboardService.getWeeklyStreamersLeaderboard();
        break;
      case "monthly":
        result = await LeaderboardService.getMonthlyStreamersLeaderboard();
        break;
      default:
        result = await LeaderboardService.getGlobalLeaderboard(limit, offset);
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    logger.error("[API] Failed to fetch leaderboard:", error as Error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

