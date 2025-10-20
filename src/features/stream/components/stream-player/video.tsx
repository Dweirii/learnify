"use client";

import { ConnectionState, Track } from "livekit-client";
import { 
  useConnectionState,
  useRemoteParticipant,
  useTracks,
} from "@livekit/components-react"

import { Skeleton } from "@/components/ui/skeleton";

import { OfflineVideo } from "./offline-video";
import { LoadingVideo } from "./loading-video";
import { LiveVideo } from "./live-video";

interface VideoProps {
  hostName: string;
  hostIdentity: string;
};

export const Video = ({
  hostName,
  hostIdentity,
}: VideoProps) => {
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);
  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.Microphone,
  ]).filter((track) => track.participant.identity === hostIdentity);

  let content;

  if (!participant && connectionState === ConnectionState.Connected) {
    content = <OfflineVideo username={hostName} />;
  } else if (!participant || tracks.length === 0) {
    content = <LoadingVideo label={connectionState} />
  } else {
    content = <LiveVideo participant={participant} />
  };

  return (
    <div className="aspect-video group relative">
      {content}
    </div>
  );
};

export const VideoSkeleton = () => {
  return (
    <div className="aspect-video shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
};
