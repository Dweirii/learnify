"use client";

import { cn } from "@/lib/utils";
import { LevelBadge } from "@/components/shared/level-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  imageUrl: string;
  level: number;
  totalXP: number;
  streamMinutes?: number;
  watchMinutes?: number;
  peakViewers?: number;
  rankChange?: number; // Positive = up, Negative = down, 0 = no change
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  type: "global" | "weekly" | "monthly";
  currentUserId?: string;
  className?: string;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Trophy className="h-5 w-5 text-orange-600" />;
  return null;
};

const getRankChangeIndicator = (change?: number) => {
  if (!change || change === 0) return <Minus className="h-3 w-3 text-white/30" />;
  if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
  return <TrendingDown className="h-3 w-3 text-red-500" />;
};

const formatStat = (type: "global" | "weekly" | "monthly", entry: LeaderboardEntry) => {
  switch (type) {
    case "global":
      return entry.totalXP?.toLocaleString() || "0";
    case "weekly":
      const hours = Math.floor((entry.streamMinutes || 0) / 60);
      const mins = (entry.streamMinutes || 0) % 60;
      return `${hours}h ${mins}m`;
    case "monthly":
      return `${entry.peakViewers?.toLocaleString() || 0}`;
    default:
      return "—";
  }
};

export const LeaderboardTable = ({
  data,
  type,
  currentUserId,
  className,
}: LeaderboardTableProps) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Trophy className="h-12 w-12 text-white/20 mb-4" />
        <p className="text-white/60 text-sm">No leaderboard data available yet</p>
        <p className="text-white/40 text-xs mt-1">Start streaming or watching to earn XP!</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-white/10 bg-[#1a1c1f]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-[#141517] text-left text-xs font-semibold uppercase tracking-wider text-white/50">
              <th className="px-4 py-3 w-16">Rank</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 text-center">Level</th>
              <th className="px-4 py-3 text-right">
                {type === "global" && "Total XP"}
                {type === "weekly" && "Stream Time"}
                {type === "monthly" && "Peak Viewers"}
              </th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((entry) => {
              const isCurrentUser = currentUserId && entry.userId === currentUserId;
              const rankIcon = getRankIcon(entry.rank);

              return (
                <tr
                  key={entry.userId}
                  className={cn(
                    "transition-colors duration-200 hover:bg-white/5",
                    isCurrentUser && "bg-[#0FA851]/10 ring-1 ring-[#0FA851]/30"
                  )}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {rankIcon || (
                        <span className={cn(
                          "font-bold text-lg",
                          isCurrentUser ? "text-[#0FA851]" : "text-white/60"
                        )}>
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* User */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/${entry.username}`}
                      className="flex items-center gap-3 group"
                    >
                      <UserAvatar
                        username={entry.username}
                        imageUrl={entry.imageUrl}
                        size="default"
                      />
                      <span className={cn(
                        "font-semibold transition-colors group-hover:text-[#0FA851]",
                        isCurrentUser ? "text-[#0FA851]" : "text-white"
                      )}>
                        {entry.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-[#0FA851]/60">(You)</span>
                        )}
                      </span>
                    </Link>
                  </td>

                  {/* Level */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <LevelBadge level={entry.level} size="md" />
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-white">
                      {formatStat(type, entry)}
                    </span>
                    {type === "global" && (
                      <span className="ml-1 text-xs text-white/40">XP</span>
                    )}
                  </td>

                  {/* Rank Change */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      {getRankChangeIndicator(entry.rankChange)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Skeleton for loading state
export const LeaderboardTableSkeleton = ({ rows = 10 }: { rows?: number }) => {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-white/10 bg-[#1a1c1f]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-[#141517]">
              <th className="px-4 py-3 w-16"></th>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="h-6 w-8 rounded bg-white/10 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse" />
                    <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 rounded-full bg-white/10 animate-pulse" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <div className="h-4 w-20 rounded bg-white/10 animate-pulse" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <div className="h-3 w-3 rounded bg-white/10 animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

