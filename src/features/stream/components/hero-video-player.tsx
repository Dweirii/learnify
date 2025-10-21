"use client";

import { useEffect, useRef, useState } from "react";
import { LiveKitRoom, VideoTrack, useRemoteParticipant, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Volume2, VolumeX, Maximize } from "lucide-react";
import Link from "next/link";

import { useViewerToken } from "@/hooks/use-viewer-token";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroVideoPlayerProps {
  hostIdentity: string;
  username: string;
}

const LiveVideo = ({ hostIdentity }: { hostIdentity: string }) => {
  const participant = useRemoteParticipant(hostIdentity);
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
  const videoTrack = tracks.find((track) => track.publication.kind === "video");

  if (!participant || !videoTrack) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0e0e10]">
        <p className="text-muted-foreground">Waiting for stream...</p>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={videoTrack}
      className="w-full h-full object-cover"
    />
  );
};

export const HeroVideoPlayer = ({ hostIdentity, username }: HeroVideoPlayerProps) => {
  const { token, name, identity } = useViewerToken(hostIdentity);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLDivElement>(null);

  if (!token || !name || !identity) {
    return <HeroVideoPlayerSkeleton />;
  }

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div ref={videoRef} className="relative w-full aspect-video bg-[#0e0e10] rounded-lg overflow-hidden group">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_WS_URL}
        className="w-full h-full"
      >
        <LiveVideo hostIdentity={`host-${hostIdentity}`} />

        {/* Overlay with controls */}
        <Link href={`/${username}`} className="absolute inset-0 z-10 cursor-pointer" />

        {/* Control buttons */}
        <div className="absolute bottom-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="p-2 bg-black/60 hover:bg-black/80 rounded-md transition"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFullscreen();
            }}
            className="p-2 bg-black/60 hover:bg-black/80 rounded-md transition"
          >
            <Maximize className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* "LIVE" badge */}
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#08AA49] rounded-md">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-bold uppercase">Live</span>
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
};

export const HeroVideoPlayerSkeleton = () => {
  return (
    <div className="w-full aspect-video bg-[#0e0e10] rounded-lg">
      <Skeleton className="w-full h-full" />
    </div>
  );
};