"use client";

import { cn } from "@/lib/utils";
import { LevelBadge } from "@/components/shared/level-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

interface MiniLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  imageUrl: string;
  level: number;
  totalXP: number;
}

interface MiniLeaderboardProps {
  data: MiniLeaderboardEntry[];
  title?: string;
  className?: string;
}

const getRankColor = (rank: number): string => {
  if (rank === 1) return "text-yellow-500";
  if (rank === 2) return "text-gray-400";
  if (rank === 3) return "text-orange-600";
  return "text-white/60";
};

export const MiniLeaderboard = ({
  data,
  title = "Top Players",
  className,
}: MiniLeaderboardProps) => {
  // Show top 5 only
  const topFive = data.slice(0, 5);

  if (topFive.length === 0) {
    return (
      <Card className={cn(
        "border-white/10 bg-[#1a1c1f] p-4",
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#0FA851]" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
        </div>
        <div className="text-center py-6">
          <Trophy className="h-8 w-8 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/40">No rankings yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-white/10 bg-[#1a1c1f] p-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#0FA851]" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <Link
          href="/leaderboard"
          className="text-xs text-[#0FA851] hover:text-[#0FA851]/80 transition-colors flex items-center gap-1"
        >
          View All
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {topFive.map((entry) => (
          <Link
            key={entry.userId}
            href={`/${entry.username}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-6">
              {entry.rank <= 3 ? (
                <Trophy className={cn("h-4 w-4", getRankColor(entry.rank))} />
              ) : (
                <span className="text-xs font-bold text-white/40">
                  #{entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <UserAvatar
              username={entry.username}
              imageUrl={entry.imageUrl}
              size="default"
            />

            {/* Username & Level */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate group-hover:text-[#0FA851] transition-colors">
                {entry.username}
              </p>
              <p className="text-xs text-white/40">
                {entry.totalXP.toLocaleString()} XP
              </p>
            </div>

            {/* Level Badge */}
            <LevelBadge level={entry.level} size="sm" />
          </Link>
        ))}
      </div>

      {/* Footer */}
      <Link
        href="/leaderboard"
        className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
      >
        <Trophy className="h-3.5 w-3.5" />
        View Full Leaderboard
      </Link>
    </Card>
  );
};

// Skeleton for loading state
export const MiniLeaderboardSkeleton = () => {
  return (
    <Card className="border-white/10 bg-[#1a1c1f] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="w-6 h-4 rounded bg-white/10 animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
              <div className="h-2 w-16 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="h-5 w-5 rounded-full bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-9 w-full rounded-lg bg-white/10 animate-pulse" />
    </Card>
  );
};

