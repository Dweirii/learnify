"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RecurrencePattern } from "@/types";

interface RecurrenceSelectorProps {
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceDays?: number[];
  recurrenceEndDate?: Date;
  onRecurrenceChange: (data: {
    isRecurring: boolean;
    recurrencePattern?: RecurrencePattern;
    recurrenceDays?: number[];
    recurrenceEndDate?: Date;
  }) => void;
  className?: string;
}

const RECURRENCE_OPTIONS: { value: RecurrencePattern; label: string; description: string }[] = [
  {
    value: "DAILY",
    label: "Daily",
    description: "Every day"
  },
  {
    value: "WEEKLY", 
    label: "Weekly",
    description: "Every week on selected days"
  },
  {
    value: "BIWEEKLY",
    label: "Bi-weekly", 
    description: "Every other week on selected days"
  },
  {
    value: "MONTHLY",
    label: "Monthly",
    description: "Every month on the same date"
  }
];

const DAY_OPTIONS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export const RecurrenceSelector = ({
  isRecurring,
  recurrencePattern,
  recurrenceDays = [],
  recurrenceEndDate,
  onRecurrenceChange,
  className
}: RecurrenceSelectorProps) => {
  const [localIsRecurring, setLocalIsRecurring] = useState(isRecurring);
  const [localPattern, setLocalPattern] = useState<RecurrencePattern | undefined>(recurrencePattern);
  const [localDays, setLocalDays] = useState<number[]>(recurrenceDays);
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(recurrenceEndDate);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Update parent when local state changes
  useEffect(() => {
    onRecurrenceChange({
      isRecurring: localIsRecurring,
      recurrencePattern: localPattern,
      recurrenceDays: localDays,
      recurrenceEndDate: localEndDate,
    });
  }, [localIsRecurring, localPattern, localDays, localEndDate, onRecurrenceChange]);

  const handleRecurringToggle = (checked: boolean) => {
    setLocalIsRecurring(checked);
    if (!checked) {
      setLocalPattern(undefined);
      setLocalDays([]);
      setLocalEndDate(undefined);
      setShowEndDatePicker(false);
    } else {
      // Set default pattern if none selected
      if (!localPattern) {
        setLocalPattern("WEEKLY");
      }
    }
  };

  const handlePatternChange = (pattern: RecurrencePattern) => {
    setLocalPattern(pattern);
    
    // Reset days when pattern changes
    if (pattern === "DAILY" || pattern === "MONTHLY") {
      setLocalDays([]);
    } else if (pattern === "WEEKLY" || pattern === "BIWEEKLY") {
      // Set default to current day if no days selected
      if (localDays.length === 0) {
        setLocalDays([new Date().getDay()]);
      }
    }
  };

  const handleDayToggle = (day: number) => {
    setLocalDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const handleEndDateChange = (dateString: string) => {
    if (dateString) {
      setLocalEndDate(new Date(dateString));
    } else {
      setLocalEndDate(undefined);
    }
  };

  const formatEndDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getSelectedDaysText = (): string => {
    if (localDays.length === 0) return "No days selected";
    if (localDays.length === 7) return "Every day";
    
    const dayNames = localDays.map(day => DAY_OPTIONS[day].short).join(", ");
    return dayNames;
  };

  const requiresDaySelection = (pattern: RecurrencePattern): boolean => {
    return pattern === "WEEKLY" || pattern === "BIWEEKLY";
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#0FA84E] rounded-full" />
          <h3 className="text-lg font-semibold text-white">Recurrence Settings</h3>
        </div>
        <p className="text-sm text-gray-400">Set up recurring streams to build consistent audience engagement</p>
      </div>
      
      <div className="space-y-6">
        {/* Recurring Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="recurring-toggle" className="text-white font-medium">
              Recurring Stream
            </Label>
            <p className="text-sm text-gray-400">
              Schedule this stream to repeat automatically
            </p>
          </div>
          <Switch
            id="recurring-toggle"
            checked={localIsRecurring}
            onCheckedChange={handleRecurringToggle}
            className="data-[state=checked]:bg-[#0FA84E]"
          />
        </div>

        {/* Recurrence Pattern */}
        {localIsRecurring && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-white font-medium">Repeat Pattern</Label>
              <Select
                value={localPattern || ""}
                onValueChange={handlePatternChange}
              >
                <SelectTrigger className="h-12 rounded-sm text-base">
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E1F24] border-gray-700/50 rounded-sm">
                  {RECURRENCE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-gray-700 focus:bg-gray-700 rounded-sm mx-1 my-0.5"
                    >
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-400">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Day Selection for Weekly/Bi-weekly */}
            {localPattern && requiresDaySelection(localPattern) && (
              <div className="space-y-3">
                <Label className="text-white font-medium">Days of Week</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DAY_OPTIONS.map((day) => (
                    <Button
                      key={day.value}
                      variant={localDays.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDayToggle(day.value)}
                      className={cn(
                        "justify-start",
                        localDays.includes(day.value)
                          ? "bg-[#0FA84E] text-white hover:bg-[#0FA84E]/90"
                          : "text-gray-300 border-gray-600 hover:bg-gray-700"
                      )}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  Selected: {getSelectedDaysText()}
                </p>
              </div>
            )}

            {/* End Date */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white font-medium">End Date</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                  className="text-gray-400 hover:text-white"
                >
                  {showEndDatePicker ? "Hide" : "Set End Date"}
                </Button>
              </div>
              
              {showEndDatePicker && (
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={localEndDate ? formatEndDate(localEndDate) : ""}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="h-12 rounded-sm text-base"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-sm text-gray-400">
                    Leave empty for indefinite recurrence
                  </p>
                </div>
              )}
              
              {localEndDate && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span>Ends: {localEndDate.toLocaleDateString()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocalEndDate(undefined)}
                    className="text-gray-500 hover:text-red-400 p-1 h-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {localIsRecurring && localPattern && (
          <div className="p-4 bg-[#1E1F24]/40 rounded-sm">
            <h4 className="text-sm font-medium text-white mb-3">Recurrence Summary</h4>
            <div className="text-sm text-gray-300 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0FA84E] rounded-full" />
                <span><span className="font-medium">Pattern:</span> {RECURRENCE_OPTIONS.find(opt => opt.value === localPattern)?.label}</span>
              </div>
              {requiresDaySelection(localPattern) && localDays.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#0FA84E] rounded-full" />
                  <span><span className="font-medium">Days:</span> {getSelectedDaysText()}</span>
                </div>
              )}
              {localEndDate && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#0FA84E] rounded-full" />
                  <span><span className="font-medium">Ends:</span> {localEndDate.toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
