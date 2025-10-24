"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { VerifiedMark } from "@/components/shared/verified-mark";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { SocialLinks } from "./social-links";
import { SocialLink } from "@/types";

interface AboutCardProps {
  hostName: string;
  hostIdentity: string;
  viewerIdentity: string;
  bio: string | null;
  followedByCount: number;
  socialLinks?: SocialLink[];
};

export const AboutCard = ({
  hostName,
  hostIdentity,
  viewerIdentity,
  bio,
  followedByCount,
  socialLinks = [],
}: AboutCardProps) => {
  const hostAsViewer = `host-${hostIdentity}`;
  const isHost = viewerIdentity === hostAsViewer;
  const { user } = useUser();

  const followedByLabel = followedByCount === 1 ? "follower" : "followers";

  return (
    <div className="px-4">
      <div className="group rounded-xl bg-background p-6 lg:p-10 flex flex-col gap-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2 font-semibold text-lg lg:text-2xl">
            About {hostName}
            <VerifiedMark />
          </div>
          {isHost && (
            <Link href={`/u/${user?.username}/settings`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Edit Bio
              </Button>
            </Link>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">
            {followedByCount}
          </span> {followedByLabel}
        </div>
        <p className="text-sm">
          {bio || "This user prefers to keep an air of mystery about them."}
        </p>
        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Connect:</span>
              <SocialLinks socialLinks={socialLinks} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};