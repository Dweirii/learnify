"use client";

import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useViewerCount } from "@/hooks/use-stream-updates";

interface HeroStreamRealTimeProps {
  streamId: string;
  initialViewerCount: number;
}

/**
 * Real-time viewer count component for hero stream
 * 
 * Features:
 * - Updates viewer count in real-time via SSE
 * - Smooth animations for count changes
 * - Fallback to initial count if SSE fails
 */
export function HeroStreamRealTime({ streamId, initialViewerCount }: HeroStreamRealTimeProps) {
  const realtimeViewerCount = useViewerCount(streamId, initialViewerCount);

  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-background text-[#08AA49] transition-all duration-200 shadow-sm"
    >
      <Users className="h-4 w-4" />
      <span className="transition-all duration-300 ease-in-out">
        {realtimeViewerCount.toLocaleString()}
      </span>
      <span className="text-xs opacity-75">viewers</span>
    </Badge>
  );
}
