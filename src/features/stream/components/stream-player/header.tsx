"use client";

import { UserIcon } from "lucide-react";
import { 
  useRemoteParticipant
} from "@livekit/components-react";

import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedMark } from "@/components/shared/verified-mark";
import { UserAvatar, UserAvatarSkeleton } from "@/components/shared/user-avatar";
import { useViewerCountFrom, useStreamLiveStatusFrom, useStreamUpdates } from "@/hooks/use-stream-updates";
import { ConnectionDot } from "@/components/shared/connection-indicator";

import { Actions, ActionsSkeleton } from "./actions";
import { StreamCategory } from "@prisma/client";

interface HeaderProps {
  imageUrl: string;
  hostName: string;
  hostIdentity: string;
  viewerIdentity: string;
  isFollowing: boolean;
  name: string;
  streamId?: string;
  initialViewerCount?: number;
  category?: StreamCategory | null;
};

export const Header = ({
  imageUrl,
  hostName,
  hostIdentity,
  viewerIdentity,
  isFollowing,
  name,
  streamId,
  initialViewerCount = 0,
  category,
}: HeaderProps) => {
  const participant = useRemoteParticipant(hostIdentity);

  const isLive = !!participant;
  
  // Use real-time viewer count from database with correct initial value
  const { lastEvent } = useStreamUpdates({ streamId: streamId || undefined });
  const realtimeViewerCount = useViewerCountFrom(lastEvent, initialViewerCount);
  const displayViewerCount = realtimeViewerCount;
  
  // Get connection state for reconnecting indicator - always call hook
  const liveStatus = useStreamLiveStatusFrom(lastEvent, isLive);

  const hostAsViewer = `host-${hostIdentity}`;
  const isHost = viewerIdentity === hostAsViewer;
  const streamUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="bg-transparent">
      <div className="px-4 py-4">
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between gap-6">
          {/* Left: Avatar + Info */}
          <div className="flex items-center gap-x-3 min-w-0 flex-1">
            <UserAvatar
              imageUrl={imageUrl}
              username={hostName}
              size="xl"
              isLive={isLive}
              showBadge
            />
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-x-2">
                <h2 className="text-lg font-semibold truncate">
                  {hostName}
                </h2>
                <VerifiedMark />
              </div>
              <p className="text-sm font-semibold text-muted-foreground truncate">
                {name}
              </p>
              {/* Stream Categories - Rounded Button Style */}
                      {category && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-[#1F2127] text-[#0FA84E]">
                            {category.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
              {/* Viewer Count */}
              {isLive && (
                <div className="flex items-center gap-1 text-xs text-[#0FA84E] animate-pulse">
                  <UserIcon className="h-3 w-3" />
                  <span className="font-semibold">
                    {displayViewerCount} {displayViewerCount === 1 ? "viewer" : "viewers"}
                  </span>
                  {streamId && liveStatus.connectionState !== 'disconnected' && (
                    <div className="flex items-center gap-1 ml-2">
                      <ConnectionDot state={liveStatus.connectionState} />
                      {liveStatus.connectionState === 'reconnecting' && (
                        <span className="text-yellow-500 animate-pulse">
                          Reconnecting...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex-shrink-0">
            <Actions
              isFollowing={isFollowing}
              hostIdentity={hostIdentity}
              hostName={hostName}
              hostImageUrl={imageUrl}
              isHost={isHost}
              streamUrl={streamUrl}
            />
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden space-y-4">
          {/* Row 1: Avatar + Info */}
          <div className="flex items-center gap-x-3">
            <UserAvatar
              imageUrl={imageUrl}
              username={hostName}
              size="xl"
              isLive={isLive}
              showBadge
            />
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-x-2">
                <h2 className="text-lg font-semibold truncate">
                  {hostName}
                </h2>
                <VerifiedMark />
              </div>
              <p className="text-sm font-semibold text-muted-foreground truncate">
                {name}
              </p>
              {/* Stream Categories - Rounded Button Style */}
                      {category && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-[#1F2127] text-[#0FA84E]">
                            {category.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
              {/* Viewer Count */}
              {isLive && (
                <div className="flex items-center gap-1 text-xs text-[#0FA84E] animate-pulse">
                  <UserIcon className="h-3 w-3" />
                  <span className="font-semibold">
                    {displayViewerCount} {displayViewerCount === 1 ? "viewer" : "viewers"}
                  </span>
                  {streamId && liveStatus.connectionState !== 'disconnected' && (
                    <div className="flex items-center gap-1 ml-2">
                      <ConnectionDot state={liveStatus.connectionState} />
                      {liveStatus.connectionState === 'reconnecting' && (
                        <span className="text-yellow-500 animate-pulse">
                          Reconnecting...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Actions */}
          <div className="flex justify-center">
            <Actions
              isFollowing={isFollowing}
              hostIdentity={hostIdentity}
              hostName={hostName}
              hostImageUrl={imageUrl}
              isHost={isHost}
              streamUrl={streamUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const HeaderSkeleton = () => {
  return (
    <div className="bg-transparent">
      <div className="px-4 py-4">
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between gap-6">
          <div className="flex items-center gap-x-3 min-w-0 flex-1">
            <UserAvatarSkeleton size="xl" />
            <div className="space-y-2 min-w-0 flex-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex-shrink-0">
            <ActionsSkeleton />
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden space-y-4">
          <div className="flex items-center gap-x-3">
            <UserAvatarSkeleton size="xl" />
            <div className="space-y-2 min-w-0 flex-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex justify-center">
            <ActionsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};
