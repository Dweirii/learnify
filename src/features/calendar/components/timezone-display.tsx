"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimezoneDisplayProps {
  timezone: string;
  onTimezoneChange?: (timezone: string) => void;
  showSelector?: boolean;
  showCurrentTime?: boolean;
  className?: string;
}

// MENA-focused timezone list
const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "Asia/Amman", label: "Amman" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Riyadh", label: "Riyadh" },
  { value: "Asia/Kuwait", label: "Kuwait" },
  { value: "Asia/Bahrain", label: "Bahrain" },
  { value: "Asia/Qatar", label: "Qatar" },
  { value: "Asia/Muscat", label: "Muscat" },
  { value: "Asia/Tehran", label: "Tehran" },
  { value: "Asia/Baghdad", label: "Baghdad" },
  { value: "Asia/Damascus", label: "Damascus" },
  { value: "Asia/Beirut", label: "Beirut" },
  { value: "Asia/Jerusalem", label: "Jerusalem" },
  { value: "Africa/Cairo", label: "Cairo" },
  { value: "Africa/Tripoli", label: "Tripoli" },
  { value: "Africa/Tunis", label: "Tunis" },
  { value: "Africa/Algiers", label: "Algiers" },
  { value: "Africa/Casablanca", label: "Casablanca" },
  { value: "Europe/Istanbul", label: "Istanbul" },
];

export const TimezoneDisplay = ({
  timezone,
  onTimezoneChange,
  showSelector = false,
  showCurrentTime = true,
  className
}: TimezoneDisplayProps) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrentTime = (): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(currentTime);
    } catch {
      return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getTimezoneLabel = (tz: string): string => {
    const timezoneOption = TIMEZONES.find(t => t.value === tz);
    return timezoneOption ? timezoneOption.label : tz;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Current Timezone Display */}
      <div className="space-y-2">
        <Label className="text-white font-medium">Timezone</Label>
        <div className="flex items-center justify-between p-3 bg-[#1E1F24] rounded-lg h-10">
          <span className="text-white font-medium">{getTimezoneLabel(timezone)}</span>
          {showCurrentTime && (
            <span className="text-[#0FA84E] font-mono">{formatCurrentTime()}</span>
          )}
        </div>
      </div>

      {/* Timezone Selector */}
      {showSelector && onTimezoneChange && (
        <div className="space-y-2">
          <Label className="text-white font-medium">Change Timezone</Label>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger className="bg-[#1E1F24] border-none text-white h-10">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E1F24] border-none">
              {TIMEZONES.map((tz) => (
                <SelectItem
                  key={tz.value}
                  value={tz.value}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                >
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

// Compact version
export const TimezoneDisplayCompact = ({
  timezone,
  showCurrentTime = true,
  className
}: Omit<TimezoneDisplayProps, 'showSelector' | 'onTimezoneChange'>) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrentTime = (): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(currentTime);
    } catch {
      return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="text-gray-300">{timezone}</span>
      {showCurrentTime && (
        <>
          <span className="text-gray-500">•</span>
          <span className="text-[#0FA84E] font-mono">{formatCurrentTime()}</span>
        </>
      )}
    </div>
  );
};

// Simple badge
export const TimezoneBadge = ({ 
  timezone, 
  className 
}: { 
  timezone: string; 
  className?: string; 
}) => {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs",
      "bg-[#0FA84E]/20 text-[#0FA84E]",
      className
    )}>
      {timezone}
    </div>
  );
};
