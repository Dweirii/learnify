"use client";

import { useEffect, useState, useRef } from "react";
import { useLevelUpModal } from "@/components/shared/level-up-modal";
import { toast } from "sonner";

interface XPData {
  level: number;
  totalXP: number;
  userId: string;
}

interface UseLevelUpDetectionProps {
  userId?: string;
  initialLevel?: number;
  initialXP?: number;
}

export const useLevelUpDetection = ({
  userId,
  initialLevel = 1,
  initialXP = 0,
}: UseLevelUpDetectionProps) => {
  const [currentData, setCurrentData] = useState<XPData>({
    level: initialLevel,
    totalXP: initialXP,
    userId: userId || '',
  });
  
  const [previousData, setPreviousData] = useState<XPData>({
    level: initialLevel,
    totalXP: initialXP,
    userId: userId || '',
  });

  const { showLevelUp, LevelUpModalComponent } = useLevelUpModal();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  // Check for XP updates
  const checkXPUpdate = async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/xp', {
        cache: 'no-store', // Always get fresh data
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const newData: XPData = {
          level: data.level,
          totalXP: data.totalXP,
          userId: data.userId,
        };

        // Check if level increased
        if (newData.level > currentData.level) {
          console.log(`🎉 Level up detected: ${currentData.level} → ${newData.level}`);
          
          // Update previous data before showing modal
          setPreviousData(currentData);
          
          // Show level up modal
          showLevelUp({
            currentLevel: newData.level,
            previousLevel: currentData.level,
            totalXP: newData.totalXP,
            username: 'You', // Could be fetched from user data
          });

          // Show toast notification
          toast.success(`Level Up! 🎉`, {
            description: `Level ${currentData.level} → Level ${newData.level}`,
            duration: 5000,
          });
        }

        // Update current data
        setCurrentData(newData);
        lastCheckRef.current = Date.now();
      }
    } catch (error) {
      console.error('Failed to check XP update:', error);
    }
  };

  // Start monitoring
  useEffect(() => {
    if (!userId) return;

    // Check immediately
    checkXPUpdate();

    // Then check every 15 seconds (same as XP calculator)
    intervalRef.current = setInterval(checkXPUpdate, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    LevelUpModalComponent,
    currentLevel: currentData.level,
    currentXP: currentData.totalXP,
    previousLevel: previousData.level,
    hasLeveledUp: currentData.level > previousData.level,
  };
};

// Hook for manual level up testing
export const useLevelUpTest = () => {
  const { showLevelUp, LevelUpModalComponent } = useLevelUpModal();

  const testLevelUp = (level: number) => {
    showLevelUp({
      currentLevel: level,
      previousLevel: level - 1,
      totalXP: level * 1000, // Mock XP
      username: 'Test User',
    });
  };

  return {
    LevelUpModalComponent,
    testLevelUp,
  };
};
