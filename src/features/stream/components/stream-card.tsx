import Link from "next/link";
import { User, type StreamCategory } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

import { Thumbnail, ThumbnailSkeleton } from "@/components/shared/thumbnail";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar, UserAvatarSkeleton } from "@/components/shared/user-avatar";
import { VerifiedMark } from "@/components/shared/verified-mark";
import { Badge } from "@/components/ui/badge";

interface StreamCardProps {
  data: {
    id: string;
    name: string;
    thumbnailUrl: string | null;
    isLive: boolean;
    updatedAt?: Date | string;
    user: User;
    category?: StreamCategory;
  };
  variant?: "grid" | "list";
};

export const StreamCard = ({
  data,
  variant = "grid",
}: StreamCardProps) => {
  const formatCategory = (category: StreamCategory | undefined) => {
    switch (category) {
      case "CODING_TECHNOLOGY":
        return "Coding & Technology";
      case "CREATIVITY_ARTS":
        return "Creativity & Arts";
      case "STUDY_FOCUS":
        return "Study & Focus";
      case "INNOVATION_BUSINESS":
        return "Innovation & Business";
      default:
        return category ?? "";
    }
  };

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
            {data.isLive && data.category && (
              <Badge className="mt-1" variant="secondary">
                {formatCategory(data.category)}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link href={`/${data.user.username}`}>
      <div className="group h-full w-full space-y-2.5 rounded-none  p-2 transition-all ">
        <Thumbnail
          src={data.thumbnailUrl}
          fallback={data.user.imageUrl}
          isLive={data.isLive}
          username={data.user.username}
        />
        <div className="flex gap-x-2.5 ">
          <UserAvatar
            username={data.user.username}
            imageUrl={data.user.imageUrl}
            isLive={data.isLive}
          />
          <div className="flex flex-col text-[13px] overflow-hidden">
            <p className="line-clamp-2 font-semibold leading-snug group-hover:text-primary transition-colors">
              {data.name}
            </p>
            <p className="text-muted-foreground truncate">
              {data.user.username}
            </p>
            {data.isLive && data.category && (
                <Badge variant="secondary" className="px-1.5 py-0.5 mt-1 text-[10px] rounded-md">
                  {formatCategory(data.category)}
                </Badge>
              )}
            <div className="mt-1 flex items-center gap-2">
              {data.updatedAt && (
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(data.updatedAt), { addSuffix: true })}
                </span>
              )}
            </div>
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
