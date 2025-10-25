"use client";

import { cn } from "@/lib/utils";
import { LevelBadge } from "@/components/shared/level-badge";
import { XPProgressBar } from "@/components/shared/xp-progress-bar";
import { Trophy, Zap, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  level: number;
  totalXP: number;
  rank?: number;
  totalUsers?: number;
  streamMinutes?: number;
  watchMinutes?: number;
  className?: string;
}

const getLevelGradient = (level: number): string => {
  if (level >= 100) return "from-red-500/20 to-purple-500/20";
  if (level >= 75) return "from-orange-500/20 to-red-500/20";
  if (level >= 50) return "from-yellow-500/20 to-orange-500/20";
  if (level >= 25) return "from-purple-500/20 to-pink-500/20";
  if (level >= 10) return "from-blue-500/20 to-[#0FA851]/20";
  return "from-gray-600/20 to-gray-500/20";
};

export const StatsCard = ({
  level,
  totalXP,
  rank,
  totalUsers,
  streamMinutes = 0,
  watchMinutes = 0,
  className,
}: StatsCardProps) => {
  const gradient = getLevelGradient(level);
  const topPercentage = rank && totalUsers ? ((rank / totalUsers) * 100).toFixed(1) : null;
  const isTopPlayer = rank && rank <= 100;

  const totalHours = Math.floor((streamMinutes + watchMinutes) / 60);

  return (
    <Card className={cn(
      "relative overflow-hidden border-white/10 bg-[#1a1c1f] p-6",
      className
    )}>
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        gradient
      )} />
      
      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white/60">Your Progress</h3>
            <div className="flex items-center gap-2 mt-1">
              <LevelBadge level={level} size="lg" />
              <div>
                <p className="text-2xl font-bold text-white">Level {level}</p>
                {isTopPlayer && (
                  <div className="flex items-center gap-1 text-xs text-[#0FA851]">
                    <Trophy className="h-3 w-3" />
                    <span>Top {rank} Player</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {rank && (
            <div className="text-right">
              <p className="text-sm text-white/60">Global Rank</p>
              <p className="text-2xl font-bold text-[#0FA851]">#{rank}</p>
              {topPercentage && (
                <p className="text-xs text-white/40">Top {topPercentage}%</p>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <XPProgressBar currentXP={totalXP} level={level} showLabel={true} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-white/60">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-xs">Total XP</span>
            </div>
            <p className="text-lg font-bold text-white">
              {totalXP.toLocaleString()}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-white/60">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs">Rank</span>
            </div>
            <p className="text-lg font-bold text-white">
              {rank ? `#${rank}` : "—"}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-white/60">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">Hours</span>
            </div>
            <p className="text-lg font-bold text-white">
              {totalHours}h
            </p>
          </div>
        </div>

        {/* View Leaderboard Button */}
        <Link
          href="/leaderboard"
          className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-[#0FA851] hover:bg-[#0FA851]/90 text-white font-semibold text-sm transition-colors"
        >
          <Trophy className="h-4 w-4" />
          View Full Leaderboard
        </Link>
      </div>
    </Card>
  );
};

// Skeleton for loading state
export const StatsCardSkeleton = () => {
  return (
    <Card className="relative overflow-hidden border-white/10 bg-[#1a1c1f] p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
              <div className="h-6 w-20 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-white/10 animate-pulse ml-auto" />
            <div className="h-6 w-16 rounded bg-white/10 animate-pulse ml-auto" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full bg-white/10 animate-pulse" />
          <div className="flex justify-between">
            <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
              <div className="h-5 w-12 rounded bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="h-10 w-full rounded-lg bg-white/10 animate-pulse" />
      </div>
    </Card>
  );
};

