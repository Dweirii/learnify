import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  className?: string;
  showViewerCount?: boolean;
  viewerCount?: number;
  size?: "sm" | "md" | "lg";
};

export const LiveBadge = ({
  className,
  showViewerCount = false,
  viewerCount = 0,
  size = "md"
}: LiveBadgeProps) => {
  const sizeClasses = {
    sm: "text-[8px] px-1 py-0.5",
    md: "text-[10px] px-1.5 py-0.5",
    lg: "text-xs px-2 py-1"
  };

  const iconSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2", 
    lg: "w-2.5 h-2.5"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-sm font-semibold tracking-wide transition-all duration-200",
      "bg-[#1F2127]/80 text-[#0FA84E]",
      "border border-[#0FA84E]/30",
      sizeClasses[size],
      className,
    )}>
      {/* Pulsing dot */}
      <div className={cn(
        "rounded-full bg-[#0FA84E] animate-pulse",
        iconSizes[size]
      )} />
      
      {/* Live text */}
      <span className="uppercase">Live</span>
      
      {/* Viewer count */}
      {showViewerCount && viewerCount > 0 && (
        <>
          <div className="w-px h-3 bg-[#0FA84E]/30" />
          <span className="font-medium">
            {viewerCount >= 1000 
              ? `${(viewerCount / 1000).toFixed(1)}K` 
              : viewerCount.toString()
            }
          </span>
        </>
      )}
    </div>
  );
};
