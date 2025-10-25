"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScheduledStream } from "@/types";
import { StreamCategory } from "@prisma/client";

interface CalendarViewProps {
  streams: ScheduledStream[];
  onDateClick?: (date: Date) => void;
  onStreamClick?: (stream: ScheduledStream) => void;
  className?: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORY_COLORS: Record<StreamCategory, string> = {
  CODING_TECHNOLOGY: "bg-blue-500",
  CREATIVITY_ARTS: "bg-purple-500", 
  STUDY_FOCUS: "bg-yellow-500",
  INNOVATION_BUSINESS: "bg-green-500",
};

const CATEGORY_BADGE_COLORS: Record<StreamCategory, string> = {
  CODING_TECHNOLOGY: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CREATIVITY_ARTS: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  STUDY_FOCUS: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", 
  INNOVATION_BUSINESS: "bg-green-500/20 text-green-300 border-green-500/30",
};

export const CalendarView = ({
  streams,
  onDateClick,
  onStreamClick,
  className
}: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Get streams for a specific date
  const getStreamsForDate = (date: Date): ScheduledStream[] => {
    return streams.filter(stream => {
      const streamDate = new Date(stream.startTime);
      return isSameDay(streamDate, date) && !stream.isCancelled;
    });
  };

  // Get streams count for a specific date
  const getStreamCountForDate = (date: Date): number => {
    return getStreamsForDate(date).length;
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className={cn("bg-[#141517] rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)]", className)}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-white">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-0 mb-4">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="h-6 flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0 border border-gray-700/50 rounded-lg overflow-hidden">
          {calendarDays.map((day, index) => {
            const dayStreams = getStreamsForDate(day);
            const streamCount = getStreamCountForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const isPastDay = day < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[80px] bg-[#141517] p-2 cursor-pointer transition-colors duration-150",
                  "hover:bg-gray-800/30",
                  !isCurrentMonth && "opacity-30",
                  isCurrentDay && "ring-1 ring-[#0FA84E]",
                  // Past days styling with better contrast
                  isPastDay && "bg-gray-800/20 hover:bg-gray-800/30",
                  // Add borders for separators
                  index % 7 !== 6 && "border-r border-gray-700/30",
                  index < 28 && "border-b border-gray-700/30"
                )}
                onClick={() => onDateClick?.(day)}
              >
                <div className="flex flex-col h-full">
                  {/* Date number */}
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isCurrentDay ? "text-[#0FA84E]" : "text-gray-300",
                    !isCurrentMonth && "text-gray-600",
                    // Past days styling with better contrast
                    isPastDay && "text-gray-500"
                  )}>
                    {format(day, "d")}
                  </div>

                  {/* Stream indicators */}
                  <div className="flex-1 space-y-0.5">
                    {dayStreams.slice(0, 2).map((stream) => (
                      <div
                        key={stream.id}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded cursor-pointer transition-opacity duration-150",
                          "hover:opacity-80",
                          CATEGORY_BADGE_COLORS[stream.category]
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStreamClick?.(stream);
                        }}
                        title={`${stream.title} - ${format(new Date(stream.startTime), "HH:mm")}`}
                      >
                        <div className="truncate font-medium">
                          {stream.title}
                        </div>
                        <div className="text-xs opacity-75">
                          {format(new Date(stream.startTime), "HH:mm")}
                        </div>
                      </div>
                    ))}
                    
                    {/* Show count if more than 2 streams */}
                    {streamCount > 2 && (
                      <div className="text-xs text-gray-500 px-1.5 py-0.5">
                        +{streamCount - 2}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Calendar Legend Component
export const CalendarLegend = ({ className }: { className?: string }) => {
  return (
    <div className={cn("bg-[#141517] rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)] p-4", className)}>
      <h3 className="text-sm font-semibold text-white mb-3">Categories</h3>
      <div className="space-y-2">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", color)} />
            <span className="text-sm text-gray-400 capitalize">
              {category.toLowerCase().replace(/_/g, " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
