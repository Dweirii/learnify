import Link from "next/link"
import { Play, Clock, TrendingUp } from "lucide-react"

import { getTopLiveStream } from "@/server/services/hero.service"
import { HeroVideoPlayer, HeroVideoPlayerSkeleton } from "./hero-video-player"
import { UserAvatar } from "@/components/shared/user-avatar"
import { VerifiedMark } from "@/components/shared/verified-mark"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HeroStreamRealTime } from "./hero-stream-realtime"
import type { StreamCategory } from "@prisma/client"

const formatCategory = (category: StreamCategory) => {
  switch (category) {
    case "CODING_TECHNOLOGY":
      return "Coding & Technology"
    case "CREATIVITY_ARTS":
      return "Creativity & Arts"
    case "STUDY_FOCUS":
      return "Study & Focus"
    case "INNOVATION_BUSINESS":
      return "Innovation & Business"
    default:
      return category
  }
}

export const HeroStream = async () => {
  const stream = await getTopLiveStream()

  // Don't render if no live stream with viewers
  if (!stream) {
    return null
  }

  return (
    <div className="w-full mb-20">
      {/* Header Section */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#08AA49] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#08AA49]"></span>
            </div>
            <span className="text-sm font-bold text-[#08AA49] uppercase tracking-wider">Live Now</span>
          </div>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Most Popular</span>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-[3px] bg-[#0BA84E] rounded-full" />
          <h2 className="text-xl font-semibold tracking-wide text-white/90 drop-shadow-[0_0_10px_rgba(0,255,120,0.15)]">
            Featured Stream
          </h2>
        </div>
        <p className="text-lg text-muted-foreground">The most watched stream happening right now</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Stream Info - Takes 5 columns on large screens */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-8">
          {/* Streamer Info */}
          <Link
            href={`/${stream.user.username}`}
            className="group flex items-start gap-5 p-6 -m-6 rounded-2xl hover:bg-accent/30 transition-all duration-300 border border-transparent hover:border-border/50"
          >
            <div className="relative">
              <UserAvatar
                username={stream.user.username}
                imageUrl={stream.user.imageUrl}
                size="lg"
                isLive={stream.isLive}
                showBadge
              />

            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors truncate">
                  {stream.user.username}
                </h3>
                <VerifiedMark />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {stream.user.bio || "No bio available"}
              </p>
            </div>
          </Link>

          {/* Stream Details */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold leading-tight line-clamp-3 text-balance bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
                {stream.name}
              </h1>

              {/* Stats Row */}
              <div className="flex items-center gap-3 flex-wrap">
                <HeroStreamRealTime streamId={stream.id} initialViewerCount={stream.viewerCount} />

                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm font-medium border-border/60 hover:bg-accent transition-all duration-200 shadow-sm"
                >
                  {formatCategory(stream.category)}
                </Badge>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Live</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={`/${stream.user.username}`}
              className="group inline-flex items-start justify-start gap-3 px-10 py-4 bg-transparent rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              <Play className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" fill="#08AA49"/>
              <span>Watch Stream</span>
            </Link>
          </div>
        </div>

        {/* Video Player - Takes 7 columns on large screens */}
        <div className="lg:col-span-7 w-full">
          <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-card group">
            <HeroVideoPlayer hostIdentity={stream.user.id} username={stream.user.username} />
            
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const HeroStreamSkeleton = () => {
  return (
    <div className="w-full mb-20">
      {/* Header Skeleton */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-20" />
          <div className="h-4 w-px bg-border"></div>
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Stream Info Skeleton */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-8">
          {/* Streamer Info Skeleton */}
          <div className="flex items-start gap-5 p-6">
            <div className="relative">
              <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-40" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Stream Details Skeleton */}
          <div className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-5/6" />
              
              <div className="flex items-center gap-3 pt-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            <Skeleton className="h-14 w-48 rounded-xl" />
          </div>
        </div>

        {/* Video Player Skeleton */}
        <div className="lg:col-span-7 w-full">
          <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
            <HeroVideoPlayerSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
