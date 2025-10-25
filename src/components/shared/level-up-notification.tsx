"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy, Zap, Star, Crown, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/shared/level-badge";

interface LevelUpNotificationProps {
  currentLevel: number;
  previousLevel: number;
  totalXP: number;
  onClose?: () => void;
}

const getLevelUpMessage = (level: number): { title: string; description: string; icon: React.ReactNode } => {
  if (level >= 100) {
    return {
      title: "LEGENDARY STATUS! 🌈",
      description: "You've reached the ultimate level! You're now a Learnify legend!",
      icon: <Crown className="h-8 w-8 text-yellow-500" />,
    };
  } else if (level >= 75) {
    return {
      title: "ELITE STATUS! 🔥",
      description: "You're now in the elite tier! Only the most dedicated reach this level!",
      icon: <Star className="h-8 w-8 text-orange-500" />,
    };
  } else if (level >= 50) {
    return {
      title: "GOLDEN STATUS! 🥇",
      description: "You've reached the golden tier! You're a top-tier community member!",
      icon: <Trophy className="h-8 w-8 text-yellow-500" />,
    };
  } else if (level >= 25) {
    return {
      title: "PURPLE STATUS! 💜",
      description: "You've reached the purple tier! You're a dedicated community member!",
      icon: <Zap className="h-8 w-8 text-purple-500" />,
    };
  } else if (level >= 10) {
    return {
      title: "GREEN STATUS! ✨",
      description: "You've reached the green tier! You're an active community member!",
      icon: <Sparkles className="h-8 w-8 text-green-500" />,
    };
  } else {
    return {
      title: "Level Up! 🎉",
      description: "Great job! Keep streaming and engaging to level up faster!",
      icon: <Trophy className="h-6 w-6 text-blue-500" />,
    };
  }
};

const isMajorLevel = (level: number): boolean => {
  return level >= 10 && (level % 10 === 0 || level === 25 || level === 50 || level === 75 || level === 100);
};

export const LevelUpNotification = ({
  currentLevel,
  previousLevel,
  totalXP,
  onClose,
}: LevelUpNotificationProps) => {
  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (currentLevel > previousLevel) {
      const { title, description } = getLevelUpMessage(currentLevel);
      
      // Always show toast notification
      toast.success(title, {
        description: `Level ${previousLevel} → Level ${currentLevel}`,
        duration: 5000,
        icon: "🎉",
      });

      // Show modal for major levels
      if (isMajorLevel(currentLevel)) {
        setShowModal(true);
        setShowConfetti(true);
        
        // Auto-hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  }, [currentLevel, previousLevel]);

  const { title, description, icon } = getLevelUpMessage(currentLevel);

  return (
    <>
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute top-1/4 left-1/4 animate-bounce">
            <div className="text-4xl">🎉</div>
          </div>
          <div className="absolute top-1/3 right-1/4 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <div className="text-3xl">✨</div>
          </div>
          <div className="absolute top-1/2 left-1/3 animate-bounce" style={{ animationDelay: '1s' }}>
            <div className="text-4xl">🏆</div>
          </div>
          <div className="absolute top-1/2 right-1/3 animate-bounce" style={{ animationDelay: '1.5s' }}>
            <div className="text-3xl">⭐</div>
          </div>
          <div className="absolute bottom-1/3 left-1/2 animate-bounce" style={{ animationDelay: '2s' }}>
            <div className="text-4xl">🎊</div>
          </div>
        </div>
      )}

      {/* Level Up Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-[#1a1c1f] border-white/10">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto">
              {icon}
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              {title}
            </DialogTitle>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <LevelBadge level={previousLevel} size="lg" />
                <div className="text-white/60">→</div>
                <LevelBadge level={currentLevel} size="lg" />
              </div>
              <p className="text-white/80 text-sm">
                {description}
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/60">Total XP</p>
                <p className="text-lg font-bold text-[#0FA851]">
                  {totalXP.toLocaleString()} XP
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                setShowModal(false);
                onClose?.();
              }}
              className="bg-[#0FA851] hover:bg-[#0FA851]/90 text-white font-semibold"
            >
              Awesome! 🚀
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                onClose?.();
                // Navigate to leaderboard
                window.location.href = '/leaderboard';
              }}
              className="border-white/20 text-white/80 hover:bg-white/5"
            >
              View Leaderboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Hook to detect level changes
export const useLevelUpDetection = (currentLevel: number, previousLevel: number) => {
  const [hasLeveledUp, setHasLeveledUp] = useState(false);

  useEffect(() => {
    if (currentLevel > previousLevel) {
      setHasLeveledUp(true);
    }
  }, [currentLevel, previousLevel]);

  return {
    hasLeveledUp,
    resetLevelUp: () => setHasLeveledUp(false),
  };
};
