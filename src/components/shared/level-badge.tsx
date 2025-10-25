"use client";

import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

const getLevelGradient = (level: number): string => {
  if (level >= 100) {
    // Rainbow gradient for level 100+
    return "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500";
  } else if (level >= 75) {
    // Orange gradient for 75-99
    return "bg-gradient-to-br from-orange-500 to-red-500";
  } else if (level >= 50) {
    // Gold gradient for 50-74
    return "bg-gradient-to-br from-yellow-500 to-orange-500";
  } else if (level >= 25) {
    // Purple gradient for 25-49
    return "bg-gradient-to-br from-purple-500 to-pink-500";
  } else if (level >= 10) {
    // Blue/Green gradient for 10-24
    return "bg-gradient-to-br from-blue-500 to-[#0FA851]";
  } else {
    // Gray gradient for 1-9
    return "bg-gradient-to-br from-gray-600 to-gray-500";
  }
};

const getLevelGlow = (level: number): string => {
  if (level >= 100) {
    return "shadow-yellow-500/50";
  } else if (level >= 75) {
    return "shadow-orange-500/50";
  } else if (level >= 50) {
    return "shadow-yellow-500/50";
  } else if (level >= 25) {
    return "shadow-purple-500/50";
  } else if (level >= 10) {
    return "shadow-green-500/50";
  } else {
    return "shadow-gray-500/50";
  }
};

const getLevelBorder = (level: number): string => {
  if (level >= 100) {
    return "border-yellow-500/50";
  } else if (level >= 75) {
    return "border-orange-500/50";
  } else if (level >= 50) {
    return "border-yellow-500/50";
  } else if (level >= 25) {
    return "border-purple-500/50";
  } else if (level >= 10) {
    return "border-green-500/50";
  } else {
    return "border-gray-500/50";
  }
};

const getSizeClasses = (size: "sm" | "md" | "lg" | "xl"): string => {
  switch (size) {
    case "sm":
      return "h-6 w-6 text-[10px] min-w-[24px]";
    case "md":
      return "h-7 w-7 text-xs min-w-[28px]";
    case "lg":
      return "h-10 w-10 text-sm min-w-[40px]";
    case "xl":
      return "h-12 w-12 text-base min-w-[48px]";
    default:
      return "h-7 w-7 text-xs min-w-[28px]";
  }
};

export const LevelBadge = ({
  level,
  size = "md",
  showLabel = false,
  className,
  animated = true,
}: LevelBadgeProps) => {
  const gradient = getLevelGradient(level);
  const border = getLevelBorder(level);
  const sizeClasses = getSizeClasses(size);

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full font-bold text-white",
          "border-2 transition-all duration-300",
          "hover:scale-105",
          gradient,
          border,
          sizeClasses
        )}
        title={`Level ${level}`}
      >
        {/* Main content */}
        <span className="relative z-10 font-black">{level}</span>
        
        {/* Subtle shine effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-40" />
        
        {/* Ping ring animation */}
        <div className={cn(
          "absolute -inset-1 rounded-full border-2 opacity-50",
          border,
          animated && "animate-ping"
        )} />
        
        {/* Sparkle effect for high levels */}
        {level >= 25 && (
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-white rounded-full" />
        )}
        
        {/* Crown effect for level 100+ */}
        {level >= 100 && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs">
            👑
          </div>
        )}
      </div>
      
      {showLabel && (
        <span className="text-sm font-semibold text-white/80">
          Level {level}
        </span>
      )}
    </div>
  );
};

// Skeleton for loading state
export const LevelBadgeSkeleton = ({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) => {
  const sizeClasses = getSizeClasses(size);
  
  return (
    <div className={cn(
      "rounded-full bg-white/10 animate-pulse",
      sizeClasses
    )} />
  );
};