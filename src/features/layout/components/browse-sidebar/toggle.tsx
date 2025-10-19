"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/store/use-sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Hint } from "@/components/shared/hint";
import { Skeleton } from "@/components/ui/skeleton";

export const Toggle = () => {
  const { collapsed, onExpand, onCollapse } = useSidebar();

  const label = collapsed ? "Expand Sidebar" : "Collapse Sidebar";

  return (
    <Hint label={label} side="right" asChild align="start">
      <Button
        onClick={() => {
          requestAnimationFrame(() => {
            if (collapsed) {
              onExpand();
            } else {
              onCollapse();
            }
          });
        }}
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-accent/50 transition-all duration-200 hidden lg:flex"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </Button>
    </Hint>
  );
};

export const ToggleSkeleton = () => {
  return (
    <div className="p-3 pl-6 mb-2 hidden lg:flex items-center justify-between w-full">
      <Skeleton className="h-6 w-[100px]" />
      <Skeleton className="h-6 w-6" />
    </div>
  );
};