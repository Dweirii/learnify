"use client";

import { cn } from "@/lib/utils";

interface SettingsTabsProps {
  activeTab: "profile" | "stream";
  onTabChange: (tab: "profile" | "stream") => void;
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="border-b border-gray-800">
      <div className="flex gap-1">
        <button
          onClick={() => onTabChange("profile")}
          className={cn(
            "px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2",
            activeTab === "profile"
              ? "border-[#0FA84E] text-white"
              : "border-transparent text-gray-400 hover:text-gray-300"
          )}
        >
          Profile
        </button>
        <button
          onClick={() => onTabChange("stream")}
          className={cn(
            "px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2",
            activeTab === "stream"
              ? "border-[#0FA84E] text-white"
              : "border-transparent text-gray-400 hover:text-gray-300"
          )}
        >
          Stream
        </button>
      </div>
    </div>
  );
}

