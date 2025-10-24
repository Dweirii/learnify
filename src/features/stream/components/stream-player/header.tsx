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

interface HeaderProps {
  imageUrl: string;
  hostName: string;
  hostIdentity: string;
  viewerIdentity: string;
  isFollowing: boolean;
  name: string;
  streamId?: string;
  initialViewerCount?: number;
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

  return (
    <div className="flex flex-col lg:flex-row gap-y-4 lg:gap-y-0 items-start justify-between px-4">
      <div className="flex items-center gap-x-3">
        <UserAvatar
          imageUrl={imageUrl}
          username={hostName}
          size="lg"
          isLive={isLive}
          showBadge
        />
        <div className="space-y-1">
          <div className="flex items-center gap-x-2">
            <h2 className="text-lg font-semibold">
              {hostName}
            </h2>
            <VerifiedMark />
          </div>
          <p className="text-sm font-semibold">
            {name}
          </p>
          {isLive ? (
            <div className="font-semibold flex gap-x-1 items-center text-xs text-rose-500"> 
              <UserIcon className="h-4 w-4" />
              <p>
                {displayViewerCount} {displayViewerCount === 1 ? "viewer" : "viewers"}
              </p>
              {streamId && liveStatus.connectionState !== 'disconnected' && (
                <div className="flex items-center gap-1 ml-1">
                  <ConnectionDot state={liveStatus.connectionState} />
                  {liveStatus.connectionState === 'reconnecting' && (
                    <span className="text-xs text-yellow-500 animate-pulse">
                      Reconnecting...
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {liveStatus.connectionState === 'reconnecting' ? (
                <>
                  <ConnectionDot state="reconnecting" />
                  <p className="font-semibold text-xs text-yellow-500 animate-pulse">
                    Reconnecting...
                  </p>
                </>
              ) : (
                <p className="font-semibold text-xs text-muted-foreground">
                  Offline
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <Actions
        isFollowing={isFollowing}
        hostIdentity={hostIdentity}
        isHost={isHost}
      />
    </div>
  );
};

export const HeaderSkeleton = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-y-4 lg:gap-y-0 items-start justify-between px-4">
      <div className="flex items-center gap-x-2">
        <UserAvatarSkeleton size="lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <ActionsSkeleton />
    </div>
  );
};
