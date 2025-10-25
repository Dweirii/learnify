"use client";

import { useState } from "react";
import { SettingsTabs } from "@/features/user/components/settings/settings-tabs";
import { ProfileTab } from "@/features/user/components/settings/profile-tab";
import { StreamTab } from "@/features/stream/components/settings/stream-tab";
import { StreamCategory } from "@prisma/client";

type SocialPlatform = "GITHUB" | "YOUTUBE" | "LINKEDIN" | "INSTAGRAM" | "TWITTER" | "FACEBOOK";

interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  order: number;
}

interface SettingsPageProps {
  user: {
    id: string;
    username: string;
    bio: string | null;
  };
  stream: {
    name: string;
    category: StreamCategory;
    thumbnailUrl: string | null;
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
    serverUrl: string;
    streamKey: string;
  };
  socialLinks: SocialLink[];
}

export function SettingsPageClient({ user, stream, socialLinks }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "stream">("profile");

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your profile and stream settings</p>
        </div>
      </div>

      {/* Tabs */}
      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "profile" && (
          <ProfileTab 
            initialBio={user.bio} 
            initialSocialLinks={socialLinks}
          />
        )}
        {activeTab === "stream" && (
          <StreamTab
            initialName={stream.name}
            initialCategory={stream.category}
            initialThumbnailUrl={stream.thumbnailUrl}
            initialIsChatEnabled={stream.isChatEnabled}
            initialIsChatDelayed={stream.isChatDelayed}
            initialIsChatFollowersOnly={stream.isChatFollowersOnly}
            serverUrl={stream.serverUrl}
            streamKey={stream.streamKey}
          />
        )}
      </div>
    </div>
  );
}
