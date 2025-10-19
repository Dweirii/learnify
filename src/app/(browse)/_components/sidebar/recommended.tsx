"use client";

import { User } from "@prisma/client";

import { useSidebar } from "@/store/use-sidebar";

import { UserItem, UserItemSkeleton } from "./user-item";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendedProps {
  data: (User & {
    stream: { isLive: boolean } | null;
  })[];
};

export const Recommended = ({
  data,
}: RecommendedProps) => {
  const { collapsed } = useSidebar((state) => state);

  const showLabel = !collapsed && data.length > 0;

  return (
    <div>
      {showLabel && (
        <div className="pl-3 mb-4">
          <p className="text-sm text-muted-foreground">
            Recommended
          </p>
        </div>
      )}
      <ul className="space-y-2 px-2">
        {data.map((user) => (
          <UserItem
            key={user.id}
            username={user.username}
            imageUrl={user.imageUrl}
            isLive={user.stream?.isLive}
          />
        ))}
      </ul>
    </div>
  );
};

export const RecommendedSkeleton = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-4 h-4 rounded-sm" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <UserItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};
