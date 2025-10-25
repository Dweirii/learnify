"use client";

import { format } from "date-fns";
import Link from "next/link";
import { Calendar, Clock, User } from "lucide-react";
import { ScheduledStream } from "@/types";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

interface ScheduledStreamCardProps {
  stream: ScheduledStream;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  CODING_TECHNOLOGY: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CREATIVITY_ARTS: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  STUDY_FOCUS: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  INNOVATION_BUSINESS: "bg-green-500/10 text-green-400 border-green-500/20",
};

const CATEGORY_NAMES: Record<string, string> = {
  CODING_TECHNOLOGY: "Coding & Technology",
  CREATIVITY_ARTS: "Creativity & Arts",
  STUDY_FOCUS: "Study & Focus",
  INNOVATION_BUSINESS: "Innovation & Business",
};

export const ScheduledStreamCard = ({ stream, className }: ScheduledStreamCardProps) => {
  const startTime = new Date(stream.startTime);
  const categoryColor = CATEGORY_COLORS[stream.category] || CATEGORY_COLORS.CODING_TECHNOLOGY;
  const categoryName = CATEGORY_NAMES[stream.category] || stream.category;

  // Calculate duration display
  const hours = Math.floor(stream.duration / 60);
  const minutes = stream.duration % 60;
  let durationText = "";
  if (hours > 0 && minutes > 0) {
    durationText = `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    durationText = `${hours}h`;
  } else {
    durationText = `${minutes}m`;
  }
  if (stream.isFlexibleDuration) {
    durationText += "+";
  }

  return (
    <Link
      href={`/${stream.user?.username}`}
      className={cn(
        "group block bg-[#141517] rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)]",
        "overflow-hidden",
        "h-full flex flex-col",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-gray-800 overflow-hidden">
        {stream.user?.imageUrl ? (
          <img
            src={stream.user.imageUrl}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <Calendar className="w-12 h-12 text-gray-600" />
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Scheduled Badge */}
        <div className="absolute top-2 right-2 bg-[#0FA84E] text-white text-xs font-bold px-2 py-1 rounded">
          SCHEDULED
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        {/* Title */}
        <h3 className="text-white font-bold text-base mb-3 group-hover:text-[#0FA84E] transition-colors line-clamp-2 leading-tight">
          {stream.title}
        </h3>

        {/* Streamer and Category */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <UserAvatar
              username={stream.user?.username || "Unknown"}
              imageUrl={stream.user?.imageUrl}
              size="sm"
            />
            <span className="text-gray-400 text-sm font-medium truncate">
              {stream.user?.username || "Unknown"}
            </span>
          </div>
          <div className={cn(
            "flex-shrink-0 px-2.5 py-1 rounded text-xs font-semibold border",
            categoryColor
          )}>
            {categoryName}
          </div>
        </div>

        {/* Description */}
        {stream.description && (
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
            {stream.description}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Meta Info */}
        <div className="space-y-1.5 pt-3 border-t border-gray-800">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(startTime, "MMM dd, yyyy")}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{format(startTime, "hh:mm a")}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500">{durationText}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

