import Link from "next/link";
import { User } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

import { Thumbnail, ThumbnailSkeleton } from "@/components/shared/thumbnail";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar, UserAvatarSkeleton } from "@/components/shared/user-avatar";
import { VerifiedMark } from "@/components/shared/verified-mark";

interface StreamCardProps {
  data: {
    id: string;
    name: string;
    thumbnailUrl: string | null;
    isLive: boolean;
    updatedAt?: Date | string;
    user: User;
  };
  variant?: "grid" | "list";
};

export const StreamCard = ({
  data,
  variant = "grid",
}: StreamCardProps) => {
  if (variant === "list") {
    return (
      <Link href={`/${data.user.username}`}>
        <div className="w-full flex gap-x-4">
          <div className="relative h-[9rem] w-[16rem]">
            <Thumbnail
              src={data.thumbnailUrl}
              fallback={data.user.imageUrl}
              isLive={data.isLive}
              username={data.user.username}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-x-2">
              <p className="font-bold text-lg cursor-pointer hover:text-blue-500">
                {data.user.username}
              </p>
              <VerifiedMark />
            </div>
            <p className="text-sm text-muted-foreground">{data.name}</p>
            {data.updatedAt && (
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(data.updatedAt), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link href={`/${data.user.username}`}>
      <div className="h-full w-full space-y-4">
        <Thumbnail
          src={data.thumbnailUrl}
          fallback={data.user.imageUrl}
          isLive={data.isLive}
          username={data.user.username}
        />
        <div className="flex gap-x-3">
          <UserAvatar
            username={data.user.username}
            imageUrl={data.user.imageUrl}
            isLive={data.isLive}
          />
          <div className="flex flex-col text-sm overflow-hidden">
            <p className="truncate font-semibold hover:text-blue-500">
              {data.name}
            </p>
            <p className="text-muted-foreground">
              {data.user.username}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const StreamCardSkeleton = ({ variant = "grid" }: { variant?: "grid" | "list" }) => {
  if (variant === "list") {
    return (
      <div className="w-full flex gap-x-4">
        <div className="relative h-[9rem] w-[16rem]">
          <ThumbnailSkeleton />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className="h-full w-full space-y-4">
      <ThumbnailSkeleton />
      <div className="flex gap-x-3">
        <UserAvatarSkeleton />
        <div className="flex flex-col gap-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24"/>
        </div>
      </div>
    </div>
  );
};
