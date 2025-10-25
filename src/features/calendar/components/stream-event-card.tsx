"use client";

import { format } from "date-fns";
import { Clock, Calendar, Repeat, Edit, Trash2, MoreHorizontal, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ScheduledStream } from "@/types";
import { StreamCategory } from "@prisma/client";

interface StreamEventCardProps {
  stream: ScheduledStream;
  onEdit?: (stream: ScheduledStream) => void;
  onDelete?: (stream: ScheduledStream) => void;
  onStartStream?: (stream: ScheduledStream) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const CATEGORY_COLORS: Record<StreamCategory, string> = {
  CODING_TECHNOLOGY: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CREATIVITY_ARTS: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  STUDY_FOCUS: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  INNOVATION_BUSINESS: "bg-green-500/20 text-green-300 border-green-500/30",
};

const CATEGORY_LABELS: Record<StreamCategory, string> = {
  CODING_TECHNOLOGY: "Coding & Tech",
  CREATIVITY_ARTS: "Creativity & Arts",
  STUDY_FOCUS: "Study & Focus",
  INNOVATION_BUSINESS: "Innovation & Business",
};

export const StreamEventCard = ({
  stream,
  onEdit,
  onDelete,
  onStartStream,
  showActions = true,
  compact = false,
  className
}: StreamEventCardProps) => {
  const formatDuration = (duration: number, isFlexible: boolean): string => {
    if (isFlexible) {
      return `${Math.floor(duration / 60)}h+`;
    }
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  const formatRecurrenceText = (): string => {
    // For now, all streams are one-time since recurrence was removed
    return "One-time";
  };

  const formatTime = (date: Date): string => {
    try {
      return format(date, "MMM d, yyyy 'at' HH:mm");
    } catch {
      return format(date, "MMM d, yyyy");
    }
  };

  const isStreamActive = (): boolean => {
    const now = new Date();
    const startTime = new Date(stream.startTime);
    const endTime = new Date(startTime.getTime() + stream.duration * 60 * 1000);
    
    return now >= startTime && now <= endTime && !stream.isCancelled;
  };

  const isUpcoming = (): boolean => {
    return new Date(stream.startTime) > new Date() && !stream.isCancelled;
  };

  const isPast = (): boolean => {
    const endTime = new Date(new Date(stream.startTime).getTime() + stream.duration * 60 * 1000);
    return endTime < new Date();
  };

  const getStatusColor = (): string => {
    if (stream.isCancelled) return "text-red-400";
    if (isStreamActive()) return "text-[#0FA84E]";
    if (isUpcoming()) return "text-blue-400";
    if (isPast()) return "text-gray-500";
    return "text-gray-400";
  };

  const getStatusText = (): string => {
    if (stream.isCancelled) return "Cancelled";
    if (isStreamActive()) return "Live Now";
    if (isUpcoming()) return "Upcoming";
    if (isPast()) return "Completed";
    return "Scheduled";
  };

  return (
    <Card 
      className={cn(
        "bg-transparent border-none shadow-[0_0_10px_0_rgba(0,0,0,0.6)] transition-all duration-200",
        "hover:shadow-[0_0_15px_0_rgba(0,0,0,0.8)] hover:scale-[1.02]",
        stream.isCancelled && "opacity-60",
        className
      )}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header with title and category */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className={cn(
                "font-semibold text-white truncate",
                compact ? "text-sm" : "text-base"
              )}>
                {stream.title}
              </h3>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs shrink-0",
                  CATEGORY_COLORS[stream.category]
                )}
              >
                {CATEGORY_LABELS[stream.category]}
              </Badge>
            </div>

            {/* Description */}
            {stream.description && !compact && (
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {stream.description}
              </p>
            )}

            {/* Time and duration info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>{formatTime(new Date(stream.startTime))}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(stream.duration, stream.isFlexibleDuration)}</span>
                {stream.isFlexibleDuration && (
                  <span className="text-xs text-gray-500">(flexible)</span>
                )}
              </div>

              {/* Recurrence info */}
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Repeat className="w-4 h-4" />
                <span>{formatRecurrenceText()}</span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-sm">
                <div className={cn("w-2 h-2 rounded-full", {
                  "bg-[#0FA84E]": isStreamActive(),
                  "bg-blue-400": isUpcoming(),
                  "bg-red-400": stream.isCancelled,
                  "bg-gray-500": isPast(),
                })} />
                <span className={getStatusColor()}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1">
              {isUpcoming() && onStartStream && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartStream(stream)}
                  className="text-[#0FA84E] border-[#0FA84E] hover:bg-[#0FA84E] hover:text-white"
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1b1e] border-gray-700">
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={() => onEdit(stream)}
                      className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(stream)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Compact version for lists
export const StreamEventCardCompact = (props: StreamEventCardProps) => {
  return <StreamEventCard {...props} compact={true} />;
};
