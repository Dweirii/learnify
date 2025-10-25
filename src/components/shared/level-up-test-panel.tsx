"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLevelUpTest } from "@/hooks/use-level-up-detection";
import { Card } from "@/components/ui/card";

export const LevelUpTestPanel = () => {
  const { LevelUpModalComponent, testLevelUp } = useLevelUpTest();
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-gradient-to-r from-[#0FA851] to-[#0C8A3E] hover:from-[#0C8A3E] hover:to-[#0A7A35] text-white font-bold text-lg px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-pulse"
        >
          🎉 EPIC LEVEL UP TEST! 🎊
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="bg-gradient-to-br from-[#1a1c1f] to-[#141517] border-2 border-white/20 p-6 space-y-4 shadow-2xl backdrop-blur-sm">
          <h3 className="text-white font-bold text-lg text-center">🎊 EPIC LEVEL UP CELEBRATIONS! 🎊</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="sm"
              onClick={() => testLevelUp(10)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              ✨ Level 10
            </Button>
            <Button
              size="sm"
              onClick={() => testLevelUp(25)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              💜 Level 25
            </Button>
            <Button
              size="sm"
              onClick={() => testLevelUp(50)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              🥇 Level 50
            </Button>
            <Button
              size="sm"
              onClick={() => testLevelUp(75)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              🔥 Level 75
            </Button>
            <Button
              size="sm"
              onClick={() => testLevelUp(100)}
              className="bg-gradient-to-r from-yellow-500 via-orange-500 via-red-500 via-purple-500 to-pink-500 hover:from-yellow-600 hover:via-orange-600 hover:via-red-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 col-span-2 animate-pulse"
            >
              🌈 LEGENDARY LEVEL 100! 🌈
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsVisible(false)}
            className="w-full border-white/30 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/50 transition-all duration-300"
          >
            Hide Panel
          </Button>
        </Card>
      </div>
      <LevelUpModalComponent />
    </>
  );
};