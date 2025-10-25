"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/shared/level-badge";
import { Trophy, Crown, Zap, Sparkles, Flame, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  previousLevel: number;
  totalXP: number;
  username?: string;
}

const getLevelUpData = (level: number) => {
  if (level >= 100) {
    return {
      title: "LEGENDARY",
      icon: Crown,
      iconColor: "text-yellow-500",
      bgColor: "bg-gradient-to-r from-yellow-500 via-orange-500 via-red-500 via-purple-500 to-pink-500",
    };
  } else if (level >= 75) {
    return {
      title: "ELITE",
      icon: Flame,
      iconColor: "text-orange-500",
      bgColor: "bg-gradient-to-r from-orange-500 to-red-500",
    };
  } else if (level >= 50) {
    return {
      title: "GOLDEN",
      icon: Trophy,
      iconColor: "text-yellow-500",
      bgColor: "bg-gradient-to-r from-yellow-500 to-orange-500",
    };
  } else if (level >= 25) {
    return {
      title: "PURPLE",
      icon: Gem,
      iconColor: "text-purple-500",
      bgColor: "bg-gradient-to-r from-purple-500 to-pink-500",
    };
  } else if (level >= 10) {
    return {
      title: "GREEN",
      icon: Sparkles,
      iconColor: "text-green-500",
      bgColor: "bg-gradient-to-r from-green-500 to-emerald-500",
    };
  } else {
    return {
      title: "LEVEL UP",
      icon: Zap,
      iconColor: "text-blue-500",
      bgColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
    };
  }
};

// MASSIVE Fireworks Component
const Fireworks = ({ isActive }: { isActive: boolean }) => {
  const [fireworks, setFireworks] = useState<Array<{
    id: number;
    x: number;
    y: number;
    particles: Array<{
      x: number;
      y: number;
      color: string;
      velocity: { x: number; y: number };
      life: number;
    }>;
  }>>([]);

  useEffect(() => {
    if (!isActive) return;

    // Only your green color with different shades
    const colors = [
      "#0FA851", // Your main green
      "#0C8A3E", // Darker green
      "#0A7A35", // Even darker green
      "#12B85C", // Lighter green
      "#16C965", // Even lighter green
      "#1ADA6E", // Bright green
      "#0FA851", // Main green again
      "#0C8A3E", // Darker green again
    ];
    
    const createFirework = () => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * (window.innerHeight * 0.7) + 50;
      
      // MORE PARTICLES PER FIREWORK (50 instead of 20)
      const particles = Array.from({ length: 50 }, () => ({
        x: 0,
        y: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: (Math.random() - 0.5) * 12, // Faster spread
          y: (Math.random() - 0.5) * 12,
        },
        life: 1,
      }));

      setFireworks(prev => [...prev, { id: Date.now(), x, y, particles }]);
    };

    // CREATE MORE FIREWORKS MORE FREQUENTLY
    const interval = setInterval(createFirework, 200); // Every 200ms instead of 500ms
    setTimeout(() => clearInterval(interval), 8000); // Run for 8 seconds

    const animationInterval = setInterval(() => {
      setFireworks(prev => 
        prev.map(fw => ({
          ...fw,
          particles: fw.particles.map(p => ({
            ...p,
            x: p.x + p.velocity.x,
            y: p.y + p.velocity.y,
            life: p.life - 0.015, // Slower fade
          })).filter(p => p.life > 0),
        })).filter(fw => fw.particles.length > 0)
      );
    }, 16);

    return () => {
      clearInterval(interval);
      clearInterval(animationInterval);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {fireworks.map(fw => (
        <div key={fw.id} className="absolute" style={{ left: fw.x, top: fw.y }}>
          {fw.particles.map((p, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: p.x,
                top: p.y,
                backgroundColor: p.color,
                opacity: p.life,
                boxShadow: `0 0 6px ${p.color}`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const LevelUpModal = ({
  isOpen,
  onClose,
  currentLevel,
  previousLevel,
  totalXP,
  username = "Streamer",
}: LevelUpModalProps) => {
  const [showFireworks, setShowFireworks] = useState(false);

  const levelData = getLevelUpData(currentLevel);
  const IconComponent = levelData.icon;

  useEffect(() => {
    if (isOpen) {
      setShowFireworks(true);
      // Stop fireworks after 8 seconds
      setTimeout(() => setShowFireworks(false), 8000);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* MASSIVE FIREWORKS */}
      <Fireworks isActive={showFireworks} />

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-sm bg-transparent border-none p-0">
          <div className="bg-[#1a1c1f] rounded-2xl p-6 text-center space-y-4 border border-white/10">
            {/* Simple Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <IconComponent className={cn("h-8 w-8", levelData.iconColor)} />
            </div>

            {/* Simple Title */}
            <h1 className={cn(
              "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
              levelData.bgColor
            )}>
              {levelData.title}
            </h1>

            {/* Simple Level Badges */}
            <div className="flex items-center justify-center gap-3">
              <LevelBadge level={previousLevel} size="md" />
              <span className="text-white/60">→</span>
              <LevelBadge level={currentLevel} size="md" />
            </div>

            {/* Simple XP */}
            <p className="text-white/80 text-sm">
              {totalXP.toLocaleString()} XP
            </p>

            {/* Simple Button */}
            <Button
              onClick={onClose}
              className={cn(
                "w-full bg-gradient-to-r text-white font-semibold",
                levelData.bgColor
              )}
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Hook to trigger level up modal
export const useLevelUpModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [levelData, setLevelData] = useState<{
    currentLevel: number;
    previousLevel: number;
    totalXP: number;
    username?: string;
  } | null>(null);

  const showLevelUp = (data: typeof levelData) => {
    setLevelData(data);
    setIsOpen(true);
  };

  const hideLevelUp = () => {
    setIsOpen(false);
    setLevelData(null);
  };

  const LevelUpModalComponent = () => {
    if (!levelData) return null;

    return (
      <LevelUpModal
        isOpen={isOpen}
        onClose={hideLevelUp}
        currentLevel={levelData.currentLevel}
        previousLevel={levelData.previousLevel}
        totalXP={levelData.totalXP}
        username={levelData.username}
      />
    );
  };

  return {
    showLevelUp,
    hideLevelUp,
    LevelUpModalComponent,
  };
};