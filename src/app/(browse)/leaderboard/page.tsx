import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { LeaderboardService } from "@/server/services/leaderboard.service";
import { LeaderboardContent } from "./leaderboard-content";

export const metadata = {
  title: "Leaderboard | Learnify",
  description: "View top players and streamers on Learnify",
};

export const revalidate = 0; // No caching for testing

async function getLeaderboardData() {
  const [globalData, weeklyData, monthlyData, stats] = await Promise.all([
    LeaderboardService.getGlobalLeaderboard(50, 0),
    LeaderboardService.getWeeklyStreamersLeaderboard(),
    LeaderboardService.getMonthlyStreamersLeaderboard(),
    LeaderboardService.getLeaderboardStats(),
  ]);

  return {
    global: globalData,
    weekly: weeklyData,
    monthly: monthlyData,
    stats,
  };
}

async function getCurrentUserId() {
  const user = await currentUser();
  if (!user) return null;

  const dbUser = await db.user.findUnique({
    where: { externalUserId: user.id },
    select: { id: true },
  });

  return dbUser?.id || null;
}

export default async function LeaderboardPage() {
  const [leaderboardData, currentUserId] = await Promise.all([
    getLeaderboardData(),
    getCurrentUserId(),
  ]);

  return (
    <div className="min-h-screen bg-[#141517] p-6">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<LeaderboardSkeleton />}>
          <LeaderboardContent
            initialData={leaderboardData}
            currentUserId={currentUserId}
          />
        </Suspense>
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-64 rounded bg-white/10 animate-pulse" />
      <div className="h-96 rounded-lg bg-white/5 animate-pulse" />
    </div>
  );
}

