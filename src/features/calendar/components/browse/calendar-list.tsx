"use client";

import { useState, useEffect } from "react";
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth } from "date-fns";
import { StreamCategory } from "@prisma/client";
import { CalendarFilters, FilterType } from "./calendar-filters";
import { ScheduledStreamCard } from "./scheduled-stream-card";
import { ScheduledStream } from "@/types";
import { 
  onGetAllPublicUpcomingStreams,
  onGetFollowingScheduledStreams,
  onGetScheduledStreams,
} from "@/server/actions/scheduled-stream";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type DatePreset = "all" | "today" | "tomorrow" | "this-week" | "next-week" | "this-month";

interface CalendarListProps {
  className?: string;
}

export const CalendarList = ({ className }: CalendarListProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("following");
  const [streams, setStreams] = useState<ScheduledStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDatePreset, setActiveDatePreset] = useState<DatePreset>("all");

  // Helper function to get date range for each preset
  const getDateRange = (preset: DatePreset): { start: Date; end: Date } | null => {
    const now = new Date();
    
    switch (preset) {
      case "today":
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      case "tomorrow":
        const tomorrow = addDays(now, 1);
        return {
          start: startOfDay(tomorrow),
          end: endOfDay(tomorrow)
        };
      case "this-week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
          end: endOfWeek(now, { weekStartsOn: 1 })
        };
      case "next-week":
        const nextWeek = addWeeks(now, 1);
        return {
          start: startOfWeek(nextWeek, { weekStartsOn: 1 }),
          end: endOfWeek(nextWeek, { weekStartsOn: 1 })
        };
      case "this-month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case "all":
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchStreams = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let result;

        if (activeFilter === "following") {
          result = await onGetFollowingScheduledStreams(50);
        } else if (activeFilter === "all") {
          result = await onGetAllPublicUpcomingStreams(50);
        } else {
          // Category filter
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          result = await onGetScheduledStreams({
            category: activeFilter as StreamCategory,
            startDate: startOfToday,
            isCancelled: false,
            limit: 50,
          });
        }

        if (result.success && result.data) {
          setStreams(result.data);
        } else {
          setError(result.error || "Failed to load streams");
          setStreams([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        setStreams([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();
  }, [activeFilter]);

  // Filter streams by date preset
  const filteredStreams = (() => {
    const dateRange = getDateRange(activeDatePreset);
    
    if (!dateRange) {
      return streams; // "all" preset - no filtering
    }
    
    return streams.filter((stream) => {
      const streamDate = new Date(stream.startTime);
      return streamDate >= dateRange.start && streamDate <= dateRange.end;
    });
  })();

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">Scheduled Streams</h1>
        <p className="text-gray-400 text-base">
          Browse upcoming streams from creators you follow or explore all scheduled streams
        </p>
      </div>

      {/* Filters */}
      <CalendarFilters
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        className="mb-8"
        datePresetSlot={
          <div className="bg-[#141517] shadow-[0_0_10px_0_rgba(0,0,0,0.6)] rounded-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-300">Filter by Time</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { 
                  label: "All Time", 
                  value: "all" as DatePreset, 
                  description: "All upcoming streams"
                },
                { 
                  label: "Today", 
                  value: "today" as DatePreset, 
                  description: "Streams today"
                },
                { 
                  label: "Tomorrow", 
                  value: "tomorrow" as DatePreset, 
                  description: "Streams tomorrow"
                },
                { 
                  label: "This Week", 
                  value: "this-week" as DatePreset, 
                  description: "This week"
                },
                { 
                  label: "Next Week", 
                  value: "next-week" as DatePreset, 
                  description: "Next week"
                },
                { 
                  label: "This Month", 
                  value: "this-month" as DatePreset, 
                  description: "This month"
                },
              ].map((preset) => {
                return (
                  <button
                    key={preset.value}
                    onClick={() => setActiveDatePreset(preset.value)}
                    className={cn(
                      "group relative p-3 rounded-sm border-none transition-all shadow-lg duration-200 text-left",
                      "hover:scale-[1.02]",
                      activeDatePreset === preset.value
                        ? "border-[#0FA84E] bg-[#0FA84E]/10"
                        : " bg-[#141517] hover:bg-[#1A1B1F]"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        activeDatePreset === preset.value 
                          ? "text-white" 
                          : "text-gray-300 group-hover:text-white"
                      )}>
                        {preset.label}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs transition-colors",
                      activeDatePreset === preset.value 
                        ? "text-[#0FA84E]/80" 
                        : "text-gray-500 group-hover:text-gray-400"
                    )}>
                      {preset.description}
                    </p>
                    {activeDatePreset === preset.value && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-[#0FA84E] rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        }
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-[#0FA84E] animate-spin mb-4" />
          <p className="text-gray-400 text-sm">Loading streams...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-500/10 rounded-lg p-5 text-red-400">
          <p className="font-semibold mb-1">Error loading streams</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredStreams.length === 0 && streams.length > 0 && (
        <div className="bg-[#141517] shadow-[0_0_10px_0_rgba(0,0,0,0.6)] rounded-lg p-16 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-gray-300 text-xl font-semibold mb-3">No streams in this time period</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              No scheduled streams found for the selected time period. Try selecting a different time period or browse all streams.
            </p>
          </div>
        </div>
      )}

      {/* Empty State - No streams at all */}
      {!isLoading && !error && streams.length === 0 && (
        <div className="bg-[#141517] shadow-[0_0_10px_0_rgba(0,0,0,0.6)] rounded-lg p-16 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-gray-300 text-xl font-semibold mb-3">No scheduled streams found</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              {activeFilter === "following"
                ? "The creators you follow haven't scheduled any streams yet. Try exploring all streams or check back later!"
                : "No upcoming streams scheduled in this category. Check out other categories or come back later!"}
            </p>
          </div>
        </div>
      )}

      {/* Stream List */}
      {!isLoading && !error && filteredStreams.length > 0 && (
        <div>
          <div className="mb-4 text-sm text-gray-400">
            Showing <span className="text-white font-semibold">{filteredStreams.length}</span> upcoming {filteredStreams.length === 1 ? 'stream' : 'streams'}
            {activeDatePreset !== "all" && (
              <span className="ml-1">
                {activeDatePreset === "today" && "today"}
                {activeDatePreset === "tomorrow" && "tomorrow"}
                {activeDatePreset === "this-week" && "this week"}
                {activeDatePreset === "next-week" && "next week"}
                {activeDatePreset === "this-month" && "this month"}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStreams.map((stream) => (
              <ScheduledStreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

