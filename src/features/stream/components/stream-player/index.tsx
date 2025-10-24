"use client";

import { LiveKitRoom } from "@livekit/components-react";
import dynamic from "next/dynamic";
import { StreamCategory } from "@prisma/client";

import { cn } from "@/lib/utils";
import { useChatSidebar } from "@/store/use-chat-sidebar";
import { useViewerToken } from "@/hooks/use-viewer-token";
import { ErrorBoundary } from "@/components/shared/error-boundary";

import { InfoCard } from "./info-card";
import { AboutCard } from "./about-card";
import { ChatToggle } from "@/features/chat/components/chat-toggle";
import { Video, VideoSkeleton } from "./video";
import { Header, HeaderSkeleton } from "./header";

// 🚀 PERFORMANCE: Dynamic imports for heavy components
const Chat = dynamic(() => import("@/features/chat/components/chat").then(mod => ({ default: mod.Chat })), {
  loading: () => <div className="flex-1 bg-background">Loading chat...</div>,
  ssr: false,
});

const ChatSkeleton = dynamic(() => import("@/features/chat/components/chat").then(mod => ({ default: mod.ChatSkeleton })), {
  ssr: false,
});

type CustomStream = {
  id: string;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
  isLive: boolean;
  thumbnailUrl: string | null;
  name: string;
  viewerCount: number;
  category: StreamCategory | null;
};

type CustomUser = {
  id: string;
  username: string;
  bio: string | null;
  stream: CustomStream | null;
  imageUrl: string;
  _count: { followedBy: number };
  socialLinks?: Array<{
    id: string;
    platform: string;
    url: string;
    order: number;
  }>;
};

interface StreamPlayerProps {
  user: CustomUser;
  stream: CustomStream;
  isFollowing: boolean;
}

export const StreamPlayer = ({
  user,
  stream,
  isFollowing
}: StreamPlayerProps) => {
  const {
    token,
    name,
    identity,
  } = useViewerToken(user.id);
  const { collapsed } = useChatSidebar((state) => state);

  if (!token || !name || !identity) {
    return <StreamPlayerSkeleton />
  }

  return (
    <ErrorBoundary
      resetKeys={[stream.id, user.id]}

    >
      {collapsed && (
        <div className="hidden lg:block fixed top-[100px] right-2 z-50">
          <ChatToggle />
        </div>
      )}
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_WS_URL}
        className={cn(
          "grid grid-cols-1 lg:gap-y-0 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 h-full",
          collapsed && "lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2"
        )}
      >
        <div className="space-y-4 col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-5 lg:overflow-y-auto hidden-scrollbar pb-10">
          <ErrorBoundary resetKeys={[stream.id]}>
            <Video
              hostName={user.username}
              hostIdentity={user.id}
            />
          </ErrorBoundary>
          <ErrorBoundary resetKeys={[stream.id, user.id]}>
            <Header
              hostName={user.username}
              hostIdentity={user.id}
              viewerIdentity={identity}
              imageUrl={user.imageUrl}
              isFollowing={isFollowing}
              name={stream.name}
              streamId={stream.id}
              initialViewerCount={stream.viewerCount}
              category={stream.category}
            />
          </ErrorBoundary>
          <ErrorBoundary resetKeys={[stream.id]}>
            <InfoCard
              hostIdentity={user.id}
              viewerIdentity={identity}
              name={stream.name}
              thumbnailUrl={stream.thumbnailUrl}
              category={stream.category}
              isLive={stream.isLive}
            />
          </ErrorBoundary>
          <ErrorBoundary resetKeys={[user.id]}>
            <AboutCard
              hostName={user.username}
              hostIdentity={user.id}
              viewerIdentity={identity}
              bio={user.bio}
              followedByCount={user._count.followedBy}
              socialLinks={user.socialLinks || []}
            />
          </ErrorBoundary>
        </div>
        <div
          className={cn(
            "col-span-1",
            collapsed && "hidden"
          )}
        >
          <ErrorBoundary resetKeys={[stream.id, user.id]}>
            <Chat
              viewerName={name}
              hostName={user.username}
              hostIdentity={user.id}
              isFollowing={isFollowing}
              isChatEnabled={stream.isChatEnabled}
              isChatDelayed={stream.isChatDelayed}
              isChatFollowersOnly={stream.isChatFollowersOnly}
            />
          </ErrorBoundary>
        </div>
      </LiveKitRoom>
    </ErrorBoundary>
  );
};

export const StreamPlayerSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:gap-y-0 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 h-full">
      <div className="space-y-4 col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-5 lg:overflow-y-auto hidden-scrollbar pb-10">
        <VideoSkeleton />
        <HeaderSkeleton />
      </div>
      <div className="col-span-1 bg-background">
        <ChatSkeleton />
      </div>
    </div>
  )
}