"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-semibold text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 text-gray-400 hover:text-white hover:bg-[#1E1F24] rounded-md transition-colors"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-1",
        head_cell:
          "text-gray-500 rounded-md w-9 font-medium text-[0.75rem] uppercase",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal rounded-md hover:bg-[#1E1F24] hover:text-white transition-colors text-gray-300"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#0FA84E] text-white hover:bg-[#0FA84E] hover:text-white focus:bg-[#0FA84E] focus:text-white font-semibold",
        day_today: "bg-gray-800 text-white font-semibold",
        day_outside:
          "day-outside text-gray-600 opacity-50",
        day_disabled: "text-gray-700 opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-[#0FA84E]/20 aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

