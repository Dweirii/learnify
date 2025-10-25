"use client";

import { useState } from "react";
import { Trophy, TrendingUp, Calendar, Users, Zap } from "lucide-react";
import { LeaderboardTable, LeaderboardTableSkeleton } from "@/features/user/components/leaderboard-table";
import { cn } from "@/lib/utils";

interface LeaderboardData {
  global: {
    entries: Array<{
      rank: number;
      userId: string;
      username: string;
      imageUrl: string;
      level: number;
      totalXP: number;
    }>;
    total: number;
  };
  weekly: {
    entries: Array<{
      rank: number;
      userId: string;
      username: string;
      imageUrl: string;
      level: number;
      totalXP: number;
      streamMinutes?: number;
    }>;
  };
  monthly: {
    entries: Array<{
      rank: number;
      userId: string;
      username: string;
      imageUrl: string;
      level: number;
      totalXP: number;
      peakViewers?: number;
    }>;
  };
  stats: {
    totalUsers: number;
    totalXP: number;
    averageLevel: number;
    topLevel: number;
  };
}

interface LeaderboardContentProps {
  initialData: LeaderboardData;
  currentUserId: string | null;
}

type TabType = "global" | "weekly" | "monthly";

const tabs = [
  {
    id: "global" as TabType,
    label: "Global Rankings",
    icon: Trophy,
    description: "Top players by total XP",
  },
  {
    id: "weekly" as TabType,
    label: "Weekly Streamers",
    icon: Calendar,
    description: "Top streamers this week by hours",
  },
  {
    id: "monthly" as TabType,
    label: "Monthly Streamers",
    icon: TrendingUp,
    description: "Top streamers this month by peak viewers",
  },
];

export function LeaderboardContent({
  initialData,
  currentUserId,
}: LeaderboardContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>("global");

  const currentData = initialData[activeTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-white/60">
          Compete with other players and streamers to reach the top
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1c1f] border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-[#0FA851]" />
            <p className="text-xs font-medium text-white/60">Total Players</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {initialData.stats.totalUsers.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#1a1c1f] border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <p className="text-xs font-medium text-white/60">Total XP</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {initialData.stats.totalXP.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#1a1c1f] border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-medium text-white/60">Average Level</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {initialData.stats.averageLevel.toFixed(1)}
          </p>
        </div>

        <div className="bg-[#1a1c1f] border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <p className="text-xs font-medium text-white/60">Highest Level</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {initialData.stats.topLevel}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative",
                isActive
                  ? "text-[#0FA851]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4" />
              <div className="text-left">
                <div className="font-semibold">{tab.label}</div>
                <div className="text-xs text-white/40">{tab.description}</div>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA851]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div>
        {currentData ? (
          <LeaderboardTable
            data={currentData.entries}
            type={activeTab}
            currentUserId={currentUserId || undefined}
          />
        ) : (
          <LeaderboardTableSkeleton />
        )}
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-white/40">
        <p>Rankings update every 5 minutes</p>
        <p className="mt-1">
          Earn XP by streaming, watching streams, and engaging with the community
        </p>
      </div>
    </div>
  );
}

