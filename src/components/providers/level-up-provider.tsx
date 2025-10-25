"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useLevelUpDetection } from "@/hooks/use-level-up-detection";

interface LevelUpContextType {
  currentLevel: number;
  currentXP: number;
  previousLevel: number;
  hasLeveledUp: boolean;
  LevelUpModalComponent: React.ComponentType;
}

const LevelUpContext = createContext<LevelUpContextType | undefined>(undefined);

export const useLevelUpContext = () => {
  const context = useContext(LevelUpContext);
  if (!context) {
    throw new Error('useLevelUpContext must be used within a LevelUpProvider');
  }
  return context;
};

interface LevelUpProviderProps {
  children: React.ReactNode;
}

export const LevelUpProvider = ({ children }: LevelUpProviderProps) => {
  const { user } = useUser();
  const [initialData, setInitialData] = useState<{
    level: number;
    xp: number;
  }>({ level: 1, xp: 0 });

  // Fetch initial XP data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/xp');
        if (response.ok) {
          const data = await response.json();
          setInitialData({
            level: data.level,
            xp: data.totalXP,
          });
        }
      } catch (error) {
        console.error('Failed to fetch initial XP data:', error);
      }
    };

    fetchInitialData();
  }, [user]);

  const {
    LevelUpModalComponent,
    currentLevel,
    currentXP,
    previousLevel,
    hasLeveledUp,
  } = useLevelUpDetection({
    userId: user?.id,
    initialLevel: initialData.level,
    initialXP: initialData.xp,
  });

  const value: LevelUpContextType = {
    currentLevel,
    currentXP,
    previousLevel,
    hasLeveledUp,
    LevelUpModalComponent,
  };

  return (
    <LevelUpContext.Provider value={value}>
      {children}
      <LevelUpModalComponent />
    </LevelUpContext.Provider>
  );
};
