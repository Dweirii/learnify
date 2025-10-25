"use client";

import { useState } from "react";
import { LevelBadge } from "@/components/shared/level-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const LevelBadgePreview = () => {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-gradient-to-r from-[#0FA851] to-[#0C8A3E] hover:from-[#0C8A3E] hover:to-[#0A7A35] text-white font-bold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          🎨 Level Badge Preview
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="bg-gradient-to-br from-[#1a1c1f] to-[#141517] border-2 border-white/20 p-6 space-y-6 shadow-2xl backdrop-blur-sm max-w-md">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">🎨 Level Badge Preview</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsVisible(false)}
            className="border-white/30 text-white/80 hover:bg-white/10 hover:text-white"
          >
            ✕
          </Button>
        </div>

        {/* Level 1-9 (Gray) */}
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-semibold">Level 1-9 (Gray Tier)</h4>
          <div className="flex items-center gap-4">
            <LevelBadge level={1} size="md" />
            <LevelBadge level={5} size="md" />
            <LevelBadge level={9} size="md" />
          </div>
        </div>

        {/* Level 10-24 (Blue → Green) */}
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-semibold">Level 10-24 (Green Tier) ✨</h4>
          <div className="flex items-center gap-4">
            <LevelBadge level={10} size="md" />
            <LevelBadge level={15} size="md" />
            <LevelBadge level={24} size="md" />
          </div>
        </div>

        {/* Level 25-49 (Purple) */}
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-semibold">Level 25-49 (Purple Tier) 💜</h4>
          <div className="flex items-center gap-4">
            <LevelBadge level={25} size="md" />
            <LevelBadge level={35} size="md" />
            <LevelBadge level={49} size="md" />
          </div>
        </div>

        {/* Level 50-74 (Gold) */}
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-semibold">Level 50-74 (Gold Tier) 🥇</h4>
          <div className="flex items-center gap-4">
            <LevelBadge level={50} size="md" />
            <LevelBadge level={60} size="md" />
            <LevelBadge level={74} size="md" />
          </div>
        </div>

        {/* Level 75-99 (Elite) */}
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-semibold">Level 75-99 (Elite Tier) 🔥</h4>
          <div className="flex items-center gap-4">
            <LevelBadge level={75} size="md" />
            <LevelBadge level={85} size="md" />
            <LevelBadge level={99} size="md" />
          </div>
        </div>

        {/* Level 100+ (Legendary) */}
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-semibold">Level 100+ (Legendary Tier) 🌈</h4>
          <div className="flex items-center gap-4">
            <LevelBadge level={100} size="md" />
            <LevelBadge level={150} size="md" />
            <LevelBadge level={200} size="md" />
          </div>
        </div>

        {/* Size Comparison */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h4 className="text-white/80 text-sm font-semibold">Size Comparison</h4>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <LevelBadge level={50} size="sm" />
              <p className="text-white/60 text-xs mt-1">Small</p>
            </div>
            <div className="text-center">
              <LevelBadge level={50} size="md" />
              <p className="text-white/60 text-xs mt-1">Medium</p>
            </div>
            <div className="text-center">
              <LevelBadge level={50} size="lg" />
              <p className="text-white/60 text-xs mt-1">Large</p>
            </div>
            <div className="text-center">
              <LevelBadge level={50} size="xl" />
              <p className="text-white/60 text-xs mt-1">Extra Large</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <h4 className="text-white/80 text-sm font-semibold">Features</h4>
          <div className="text-white/60 text-xs space-y-1">
            <p>✨ Ping ring animation</p>
            <p>💫 Subtle shine effect</p>
            <p>⭐ Sparkle for level 25+</p>
            <p>👑 Crown for level 100+</p>
            <p>🎨 Beautiful gradients</p>
            <p>🖱️ Hover scale effect</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
