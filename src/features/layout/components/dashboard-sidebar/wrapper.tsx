"use client";

import { cn } from "@/lib/utils";
import { useCreatorSidebar } from "@/store/use-creator-sidebar";

interface WrapperProps {
  children: React.ReactNode;
};

export const Wrapper = ({
  children,
}: WrapperProps) => {
  const { collapsed } = useCreatorSidebar((state) => state);

  return (
    <aside
      className={cn(
        "fixed left-0 w-60 h-full z-40 bg-[#141517] shadow-[0_0_10px_0_rgba(0,0,0,0.6)] p-4 transition-all duration-300 ease-in-out",
        collapsed && "w-[70px] px-2"
      )}
    >
      <div className="h-full flex flex-col">
        {children}
      </div>
    </aside>
  );
};
