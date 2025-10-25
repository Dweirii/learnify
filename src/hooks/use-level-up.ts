"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { LevelUpNotification } from "@/components/shared/level-up-notification";

interface UseLevelUpProps {
  userId?: string;
  currentLevel?: number;
  currentXP?: number;
}

type IntervalType = ReturnType<typeof setInterval>;

export const useLevelUp = ({
  userId,
  currentLevel = 1,
  currentXP = 0,
}: UseLevelUpProps) => {
  const [showNotification, setShowNotification] = useState(false);

  // Keep previous values in refs to avoid race conditions and stale closures
  const prevLevelRef = useRef<number>(currentLevel);
  const prevXPRef = useRef<number>(currentXP);

  // For displaying "from → to" in the notification
  const [previousLevelForUI, setPreviousLevelForUI] = useState<number>(currentLevel);
  const [totalXPForUI, setTotalXPForUI] = useState<number>(currentXP);

  // Track mounted state to avoid setting state after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Trigger notification if incoming props reflect a level-up
  useEffect(() => {
    if (currentLevel > prevLevelRef.current) {
      // Store "before" values for the UI
      setPreviousLevelForUI(prevLevelRef.current);
      setTotalXPForUI(currentXP);
      setShowNotification(true);

      // Update refs to the newest values
      prevLevelRef.current = currentLevel;
      prevXPRef.current = currentXP;
      return;
    }

    // If no level change, just sync refs forward
    prevLevelRef.current = currentLevel;
    prevXPRef.current = currentXP;
  }, [currentLevel, currentXP]);

  // Poll for XP/level updates every 30s (only if userId exists)
  useEffect(() => {
    if (!userId) return;

    let intervalId: IntervalType | null = null;

    const checkXP = async () => {
      try {
        const url = `/api/xp?userId=${encodeURIComponent(userId)}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return;

        const data = await response.json() as { level?: number; xp?: number };

        const nextLevel = typeof data.level === "number" ? data.level : prevLevelRef.current;
        const nextXP = typeof data.xp === "number" ? data.xp : prevXPRef.current;

        // If level increased compared to our last known level, show once
        if (nextLevel > prevLevelRef.current) {
          // Capture previous values for the UI
          setPreviousLevelForUI(prevLevelRef.current);
          setTotalXPForUI(nextXP);
          if (mountedRef.current) setShowNotification(true);

          // Advance refs so we don't show duplicates
          prevLevelRef.current = nextLevel;
          prevXPRef.current = nextXP;
        } else {
          // Keep refs in sync even without a level up
          prevLevelRef.current = nextLevel;
          prevXPRef.current = nextXP;
        }
      } catch (err) {
        // Optional: add logging/telemetry
        console.error("Failed to check XP:", err);
      }
    };

    // Initial check, then interval
    checkXP();
    intervalId = setInterval(checkXP, 30_000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userId]);

  const dismissNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  const LevelUpComponent = () => {
    if (!showNotification) return null;
    return (
      <LevelUpNotification
        currentLevel={prevLevelRef.current}
        previousLevel={previousLevelForUI}
        totalXP={totalXPForUI}
        onClose={dismissNotification}
      />
    );
  };

  return {
    LevelUpComponent,
    hasLeveledUp: showNotification,
    dismissNotification,
  };
};
