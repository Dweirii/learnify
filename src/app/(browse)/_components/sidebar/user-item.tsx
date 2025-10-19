"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/store/use-sidebar";
import { UserAvatar } from "@/components/user-avatar";
import { LiveBadge } from "@/components/live-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface UserItemProps {
  username: string;
  imageUrl: string;
  isLive?: boolean;
  viewerCount?: number;
}

export const UserItem = ({
  username,
  imageUrl,
  isLive = false,
  viewerCount = 0,
}: UserItemProps) => {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  const href = `/${username}`;
  const isActive = pathname === href;

  const content = (
    <div
      className={cn(
        "flex items-center w-full gap-x-3 transition-colors",
        collapsed ? "justify-center" : "justify-start"
      )}
    >
      <UserAvatar 
        imageUrl={imageUrl} 
        username={username} 
        isLive={isLive}
        showBadge={isLive}
      />

      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate block">
              {username}
            </span>
            {isLive && (
              <span className="text-xs text-muted-foreground">
                {viewerCount} watching
              </span>
            )}
          </div>
          {isLive && <LiveBadge className="ml-auto flex-shrink-0"/>}
        </>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                  "w-full h-10 px-2",
                  isActive && "bg-accent text-accent-foreground"
                )}
            >
              <Link href={href}>
                {content}
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="flex items-center gap-2">
              <span>{username}</span>
              {isLive && <LiveBadge/>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn(
        "w-full h-12 px-1 justify-start",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      <Link href={href}>
        {content}
      </Link>
    </Button>
  );
};

export const UserItemSkeleton = () => {
  return (
    <li className="flex items-center gap-x-4 px-3 py-2">
      <Skeleton className="min-h-[32px] min-w-[32px] rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-6" />
      </div>
    </li>
  );
};
