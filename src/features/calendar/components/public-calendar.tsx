"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScheduledStream } from "@/types";
import { StreamCategory } from "@prisma/client";

interface PublicCalendarProps {
  streams: ScheduledStream[];
  username: string;
  className?: string;
}

const CATEGORY_BADGE_COLORS: Record<StreamCategory, string> = {
  CODING_TECHNOLOGY: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CREATIVITY_ARTS: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  STUDY_FOCUS: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  INNOVATION_BUSINESS: "bg-green-500/20 text-green-300 border-green-500/30",
};

const CATEGORY_LABELS: Record<StreamCategory, string> = {
  CODING_TECHNOLOGY: "Coding & Tech",
  CREATIVITY_ARTS: "Creative & Arts",
  STUDY_FOCUS: "Study & Focus",
  INNOVATION_BUSINESS: "Business & Innovation",
};

export const PublicCalendar = ({
  streams,
  username,
  className
}: PublicCalendarProps) => {
  console.log("PublicCalendar received streams:", streams.length); // Debug log
  
  const [viewerTimezone, setViewerTimezone] = useState<string>("UTC");

  // Detect viewer's timezone
  useEffect(() => {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setViewerTimezone(detectedTimezone);
    } catch (error) {
      console.warn("Could not detect timezone, using UTC:", error);
      setViewerTimezone("UTC");
    }
  }, []);

  // Convert stream time to viewer's timezone
  const convertToViewerTime = useCallback((streamTime: Date, streamTimezone: string): Date => {
    try {
      // Create a date in the stream's timezone
      const streamDate = new Date(streamTime);
      
      // Get the offset difference between stream timezone and viewer timezone
      const streamOffset = new Date(streamDate.toLocaleString("en-US", { timeZone: streamTimezone })).getTime() - streamDate.getTime();
      const viewerOffset = new Date(streamDate.toLocaleString("en-US", { timeZone: viewerTimezone })).getTime() - streamDate.getTime();
      
      // Apply the offset difference
      return new Date(streamDate.getTime() + (streamOffset - viewerOffset));
    } catch (error) {
      console.warn("Timezone conversion failed, using original time:", error);
      return streamTime;
    }
  }, [viewerTimezone]);

  // Format time in viewer's timezone
  const formatInViewerTime = (streamTime: Date, streamTimezone: string): string => {
    try {
      const convertedTime = convertToViewerTime(streamTime, streamTimezone);
      return format(convertedTime, "HH:mm");
    } catch {
      return format(streamTime, "HH:mm");
    }
  };

  // Get upcoming streams for the sidebar
  const upcomingStreams = useMemo(() => {
    const now = new Date();
    const filteredStreams = streams
      .filter(stream => {
        const convertedTime = convertToViewerTime(new Date(stream.startTime), stream.timezone);
        return convertedTime > now && !stream.isCancelled;
      })
      .sort((a, b) => {
        const timeA = convertToViewerTime(new Date(a.startTime), a.timezone);
        const timeB = convertToViewerTime(new Date(b.startTime), b.timezone);
        return timeA.getTime() - timeB.getTime();
      });
    
    // Deduplicate streams by ID to prevent duplicate keys
    const uniqueStreams = filteredStreams.filter((stream, index, self) => 
      index === self.findIndex(s => s.id === stream.id)
    );
    
    return uniqueStreams.slice(0, 5);
  }, [streams, convertToViewerTime]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">
          {username}&apos;s Schedule
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Upcoming streams and events
        </p>
        <span className="text-xs text-gray-500">
          Times shown in {viewerTimezone}
        </span>
      </div>

      {/* Upcoming Streams List */}
      <div className="bg-[#141517] rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)] p-3 sm:p-4">
        <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          Upcoming Streams
        </h4>
        
        {upcomingStreams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No upcoming streams scheduled</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {upcomingStreams.map((stream, index) => (
              <div
                key={`${stream.id}-${index}`}
                className="p-2 sm:p-3 bg-[#1E1F24]/50 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs sm:text-sm font-medium text-white line-clamp-2 flex-1">
                      {stream.title}
                    </h5>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0",
                      CATEGORY_BADGE_COLORS[stream.category]
                    )}>
                      <span className="hidden sm:inline">{CATEGORY_LABELS[stream.category]}</span>
                      <span className="sm:hidden">{CATEGORY_LABELS[stream.category].split(' ')[0]}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-400">
                    <span className="hidden sm:inline">{format(convertToViewerTime(new Date(stream.startTime), stream.timezone), "MMM d, yyyy")}</span>
                    <span className="sm:hidden">{format(convertToViewerTime(new Date(stream.startTime), stream.timezone), "M/d")}</span>
                    <span>•</span>
                    <span>{formatInViewerTime(new Date(stream.startTime), stream.timezone)}</span>
                  </div>
                  
                  {stream.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {stream.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
