"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/store/use-sidebar";
import { useEffect, useState } from "react";

interface WrapperProps {
  children: React.ReactNode;
}

export const Wrapper = ({ children }: WrapperProps) => {
  const { collapsed } = useSidebar();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <aside
      className={cn(
        "fixed left-0 w-60 h-full z-40 bg-white dark:bg-[#141517] dark:shadow-lg shadow-lg p-4 transition-all duration-200",
        collapsed && "w-[70px]"
      )}
    >
      {children}
    </aside>
  );
};
