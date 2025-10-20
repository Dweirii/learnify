import Link from "next/link";
import { Users } from "lucide-react";

import { getTopLiveStream } from "@/server/services/hero.service";
import { HeroVideoPlayer, HeroVideoPlayerSkeleton } from "./hero-video-player";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VerifiedMark } from "@/components/shared/verified-mark";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { StreamCategory } from "@prisma/client";

const formatCategory = (category: StreamCategory) => {
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
      return category;
  }
};

export const HeroStream = async () => {
  const stream = await getTopLiveStream();

  // Don't render if no live stream with viewers
  if (!stream) {
    return null;
  }

  return (
    <div className="w-full mb-12">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Featured Live Stream</h2>
        <p className="text-sm text-muted-foreground">Most watched stream right now</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left: Video Player (50%) */}
        <div className="w-full">
          <HeroVideoPlayer 
            hostIdentity={stream.user.id} 
            username={stream.user.username}
          />
        </div>

        {/* Right: Stream Info (50%) */}
        <div className="flex flex-col justify-center space-y-6">
          <Link 
            href={`/${stream.user.username}`}
            className="flex items-start gap-4 group"
          >
            <UserAvatar
              username={stream.user.username}
              imageUrl={stream.user.imageUrl}
              size="lg"
              isLive={stream.isLive}
              showBadge
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {stream.user.username}
                </h3>
                <VerifiedMark />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {stream.user.bio || "No bio available"}
              </p>
            </div>
          </Link>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight line-clamp-2">
              {stream.name}
            </h1>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Viewer Count */}
              <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
                <Users className="h-4 w-4 text-rose-500" />
                <span className="font-semibold">
                  {stream.viewerCount.toLocaleString()} {stream.viewerCount === 1 ? "viewer" : "viewers"}
                </span>
              </Badge>

              {/* Category Badge */}
              <Badge variant="outline" className="px-3 py-1.5">
                {formatCategory(stream.category)}
              </Badge>
            </div>

            <Link
              href={`/${stream.user.username}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors"
            >
              Watch Stream
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HeroStreamSkeleton = () => {
  return (
    <div className="w-full mb-12">
      <div className="mb-4 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="w-full">
          <HeroVideoPlayerSkeleton />
        </div>
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
};