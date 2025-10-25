"use client";

import { useCreatorSidebar } from "@/store/use-creator-sidebar";

export const Toggle = () => {
  const {
    collapsed,
  } = useCreatorSidebar((state) => state);

  return (
    <>
      {!collapsed && (
        <div className="p-1 pl-3 mb-2 hidden lg:flex items-center w-full">
          <p className="font-semibold text-primary">
            Dashboard
          </p>
        </div>
      )}
    </>
  );
};
