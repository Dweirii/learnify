"use client";

import { useEffect, useState, useRef } from "react";
import { LevelUpNotification } from "@/components/shared/level-up-notification";

interface UseLevelUpProps {
  userId?: string;
  currentLevel?: number;
  currentXP?: number;
}

export const useLevelUp = ({ userId, currentLevel = 1, currentXP = 0 }: UseLevelUpProps) => {
  const [previousLevel, setPreviousLevel] = useState(currentLevel);
  const [previousXP, setPreviousXP] = useState(currentXP);
  const [showNotification, setShowNotification] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for level up when data changes
  useEffect(() => {
    if (currentLevel > previousLevel) {
      setShowNotification(true);
    }
    
    // Update previous values
    setPreviousLevel(currentLevel);
    setPreviousXP(currentXP);
  }, [currentLevel, currentXP]);

  // Auto-poll for XP updates (every 30 seconds)
  useEffect(() => {
    if (!userId) return;

    const checkXP = async () => {
      try {
        const response = await fetch('/api/xp');
        if (response.ok) {
          const data = await response.json();
          
          // Check if level increased
          if (data.level > currentLevel) {
            setPreviousLevel(currentLevel);
            setPreviousXP(currentXP);
            setShowNotification(true);
          }
        }
      } catch (error) {
        console.error('Failed to check XP:', error);
      }
    };

    // Check immediately
    checkXP();
    
    // Then check every 30 seconds
    intervalRef.current = setInterval(checkXP, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, currentLevel, currentXP]);

  const LevelUpComponent = () => {
    if (!showNotification) return null;

    return (
      <LevelUpNotification
        currentLevel={currentLevel}
        previousLevel={previousLevel}
        totalXP={currentXP}
        onClose={() => setShowNotification(false)}
      />
    );
  };

  return {
    LevelUpComponent,
    hasLeveledUp: showNotification,
    dismissNotification: () => setShowNotification(false),
    previousLevel,
    previousXP,
  };
};