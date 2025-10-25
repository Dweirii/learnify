"use client";

import { cn } from "@/lib/utils";
import { XPService } from "@/server/services/xp.service";
import { useEffect, useState } from "react";

interface XPProgressBarProps {
  currentXP: number;
  level: number;
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
}

const getLevelGradient = (level: number): string => {
  if (level >= 100) {
    return "from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500";
  } else if (level >= 75) {
    return "from-orange-500 to-red-500";
  } else if (level >= 50) {
    return "from-yellow-500 to-orange-500";
  } else if (level >= 25) {
    return "from-purple-500 to-pink-500";
  } else if (level >= 10) {
    return "from-blue-500 to-[#0FA851]";
  } else {
    return "from-gray-600 to-gray-500";
  }
};

export const XPProgressBar = ({
  currentXP,
  level,
  showLabel = true,
  className,
  animate = true,
}: XPProgressBarProps) => {
  const [displayPercentage, setDisplayPercentage] = useState(0);
  
  // Calculate progress to next level
  const progress = XPService.getLevelProgress(currentXP, level);
  const percentage = progress.percentage;
  
  const gradient = getLevelGradient(level);

  // Animate progress bar on mount
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setDisplayPercentage(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayPercentage(percentage);
    }
  }, [percentage, animate]);

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
        {/* Background glow */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r opacity-20 blur-sm",
            gradient
          )}
          style={{ width: `${displayPercentage}%` }}
        />
        
        {/* Actual progress */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r shadow-lg transition-all duration-700 ease-out",
            gradient
          )}
          style={{ width: `${displayPercentage}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-white/60">
            {progress.currentLevelXP.toLocaleString()} / {progress.xpForNextLevel.toLocaleString()} XP
          </span>
          <span className="font-bold text-[#0FA851]">
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Skeleton for loading state
export const XPProgressBarSkeleton = () => {
  return (
    <div className="w-full space-y-1.5">
      <div className="h-2 w-full rounded-full bg-white/10 animate-pulse" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  );
};

