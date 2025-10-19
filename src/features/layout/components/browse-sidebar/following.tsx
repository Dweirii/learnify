"use client";

import { Follow, User } from "@prisma/client";

import { useSidebar } from "@/store/use-sidebar";

import { UserItem, UserItemSkeleton } from "./user-item";
import { Skeleton } from "@/components/ui/skeleton";

interface FollowingProps {
  data: (Follow & { 
    following: User & {
      stream: { isLive: boolean } | null;
    },
  })[];
}

export const Following = ({
  data,
}: FollowingProps) => {
  const { collapsed } = useSidebar((state) => state);

  if (!data.length) {
    return null;
  }

  return (
    <div>
      {!collapsed && (
        <div className="pl-3 mb-4">
          <p className="text-sm text-muted-foreground">
            Following
          </p>
        </div>
      )}
      <ul className="space-y-2 px-2">
        {data.map((follow) => (
          <UserItem
            key={follow.following.id}
            username={follow.following.username}
            imageUrl={follow.following.imageUrl}
            isLive={follow.following.stream?.isLive}
          />
        ))}
      </ul>
    </div>
  );
};

export const FollowingSkeleton = () => {
  const { collapsed } = useSidebar();

  return (
    <div className="flex flex-col gap-2">
      {!collapsed && (
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-4 h-4 rounded-sm" />
          <Skeleton className="h-4 w-24" />
        </div>
      )}
      <div className="space-y-2">
        {[...Array(2)].map((_, index) => (
          <UserItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};
