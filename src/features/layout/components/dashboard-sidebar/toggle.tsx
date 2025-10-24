"use client";

import { useCreatorSidebar } from "@/store/use-creator-sidebar";

export const Toggle = () => {
  const { collapsed } = useCreatorSidebar((state) => state);

  return (
    <div className="p-1 pl-3 mb-4">
      {!collapsed && (
        <p className="font-semibold text-primary text-lg">
          Dashboard
        </p>
      )}
    </div>
  );
};
