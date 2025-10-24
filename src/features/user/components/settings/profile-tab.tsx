"use client";

import { ProfileInfoCard } from "./profile-info-card";
import { BioCard } from "./bio-card";

interface ProfileTabProps {
  initialBio: string | null;
}

export function ProfileTab({ initialBio }: ProfileTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Profile Settings</h2>
        <p className="text-gray-400">
          Manage your personal information and bio
        </p>
      </div>

      <ProfileInfoCard />
      <BioCard initialBio={initialBio} />
    </div>
  );
}
