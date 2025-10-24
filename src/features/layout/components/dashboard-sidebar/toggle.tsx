"use client";

import { ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react";

import { Hint } from "@/components/shared/hint";
import { Button } from "@/components/ui/button";
import { useCreatorSidebar } from "@/store/use-creator-sidebar";

export const Toggle = () => {
  const {
    collapsed,
    onExpand,
    onCollapse,
  } = useCreatorSidebar((state) => state);

  const label = collapsed ? "Expand" : "Collapse";

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
