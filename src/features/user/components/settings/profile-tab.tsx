"use client";

import { ProfileInfoCard } from "./profile-info-card";
import { BioCard } from "./bio-card";
import { SocialLinksCard } from "./social-links-card";
type SocialPlatform = "GITHUB" | "YOUTUBE" | "LINKEDIN" | "INSTAGRAM" | "TWITTER" | "FACEBOOK";

interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  order: number;
}

interface ProfileTabProps {
  initialBio: string | null;
  initialSocialLinks: SocialLink[];
}

export function ProfileTab({ initialBio, initialSocialLinks }: ProfileTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Profile Settings</h2>
        <p className="text-gray-400">
          Manage your personal information, bio, and social media links
        </p>
      </div>

      <ProfileInfoCard />
      <BioCard initialBio={initialBio} />
      <SocialLinksCard initialSocialLinks={initialSocialLinks} />
    </div>
  );
}
