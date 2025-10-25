"use client";

import { StreamCategory } from "@prisma/client";
import { cn } from "@/lib/utils";

export type FilterType = "following" | "all" | StreamCategory;

interface CalendarFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  className?: string;
}

const MAIN_FILTERS: { label: string; value: FilterType }[] = [
  { label: "Following", value: "following" },
  { label: "All Streams", value: "all" },
];

const CATEGORY_FILTERS: { label: string; value: StreamCategory }[] = [
  { label: "Coding & Tech", value: "CODING_TECHNOLOGY" },
  { label: "Arts & Creativity", value: "CREATIVITY_ARTS" },
  { label: "Study & Focus", value: "STUDY_FOCUS" },
  { label: "Innovation & Business", value: "INNOVATION_BUSINESS" },
];

interface CalendarFiltersExtendedProps extends CalendarFiltersProps {
  datePresetSlot?: React.ReactNode;
}

export const CalendarFilters = ({
  activeFilter,
  onFilterChange,
  datePresetSlot,
  className,
}: CalendarFiltersExtendedProps) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Filters - Tab Style */}
      <div className="border-b border-gray-800">
        <div className="flex gap-1">
          {MAIN_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 relative",
                activeFilter === filter.value
                  ? "border-[#0FA84E] text-white"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters - Tab Style */}
      <div>
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">
          Filter by Category
        </h3>
        <div className="border-b border-gray-800">
          <div className="flex flex-wrap gap-1">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => onFilterChange(filter.value)}
                className={cn(
                  "px-5 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap",
                  activeFilter === filter.value
                    ? "border-[#0FA84E] text-white"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date Preset Filter */}
      {datePresetSlot && (
        <div>
          {datePresetSlot}
        </div>
      )}
    </div>
  );
};

