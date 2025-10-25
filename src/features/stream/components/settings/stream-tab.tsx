"use client";

import { StreamInfoCard } from "./stream-info-card";
import { ChatSettingsCard } from "./chat-settings-card";
import { StreamKeysCard } from "./stream-keys-card";
import { StreamCategory } from "@prisma/client";

interface StreamTabProps {
  initialName: string;
  initialCategory: StreamCategory;
  initialThumbnailUrl: string | null;
  initialIsChatEnabled: boolean;
  initialIsChatDelayed: boolean;
  initialIsChatFollowersOnly: boolean;
  serverUrl: string | null;
  streamKey: string | null;
}

export function StreamTab({
  initialName,
  initialCategory,
  initialThumbnailUrl,
  initialIsChatEnabled,
  initialIsChatDelayed,
  initialIsChatFollowersOnly,
  serverUrl,
  streamKey,
}: StreamTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Stream Settings</h2>
        <p className="text-gray-400">
          Configure your stream information, chat settings, and streaming keys
        </p>
      </div>

      <StreamInfoCard
        initialName={initialName}
        initialCategory={initialCategory}
        initialThumbnailUrl={initialThumbnailUrl}
      />

      <ChatSettingsCard
        initialIsChatEnabled={initialIsChatEnabled}
        initialIsChatDelayed={initialIsChatDelayed}
        initialIsChatFollowersOnly={initialIsChatFollowersOnly}
      />

      <StreamKeysCard
        serverUrl={serverUrl}
        streamKey={streamKey}
      />
    </div>
  );
}
