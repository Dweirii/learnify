"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Hint } from "@/components/shared/hint";
import { useCreatorSidebar } from "@/store/use-creator-sidebar";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
};

export const NavItem = ({
  icon: Icon,
  label,
  href,
  isActive,
}: NavItemProps) => {
  const { collapsed } = useCreatorSidebar((state) => state);

  const buttonContent = (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "w-full h-12 transition-all duration-200",
        collapsed ? "justify-center px-0" : "justify-start px-3",
        isActive && "bg-accent text-accent-foreground",
        !isActive && "hover:bg-accent/50"
      )}
    >
      <Link href={href}>
        <div className="flex items-center gap-x-4">
          <Icon className={cn(
            "h-5 w-5 transition-all duration-200",
            collapsed ? "mr-0" : "mr-2"
          )} />
          {!collapsed && (
            <span className="font-medium">
              {label}
            </span>
          )}
        </div>
      </Link>
    </Button>
  );

  if (collapsed) {
    return (
      <Hint label={label} side="right" asChild align="start">
        {buttonContent}
      </Hint>
    );
  }

  return buttonContent;
};

export const NavItemSkeleton = () => {
  const { collapsed } = useCreatorSidebar((state) => state);
  
  return (
    <li className="flex items-center gap-x-4 px-3 py-2">
      <Skeleton className={cn(
        "rounded-md",
        collapsed ? "h-12 w-12" : "min-h-[48px] min-w-[48px]"
      )} />
      {!collapsed && (
        <div className="flex-1">
          <Skeleton className="h-6" />
        </div>
      )}
    </li>
  );
};
