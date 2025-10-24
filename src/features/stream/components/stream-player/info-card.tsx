"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil, Settings } from "lucide-react";
import { StreamCategory } from "@prisma/client";
import { useUser } from "@clerk/nextjs";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface InfoCardProps {
  name: string;
  thumbnailUrl: string | null;
  hostIdentity: string;
  viewerIdentity: string;
  category: StreamCategory | null;
  isLive: boolean;
};

export const InfoCard = ({
  name,
  thumbnailUrl,
  hostIdentity,
  viewerIdentity,
  category,
  isLive,
}: InfoCardProps) => {
  const hostAsViewer = `host-${hostIdentity}`;
  const isHost = viewerIdentity === hostAsViewer;
  const { user } = useUser();

  // Helper function to format category display
  const formatCategory = (cat: StreamCategory | null): string => {
    if (!cat) return 'No category set';
    
    // Convert enum values to readable format
    switch (cat) {
      case 'CODING_TECHNOLOGY':
        return 'Coding & Technology';
      case 'CREATIVITY_ARTS':
        return 'Creativity & Arts';
      case 'STUDY_FOCUS':
        return 'Study & Focus';
      case 'INNOVATION_BUSINESS':
        return 'Innovation & Business';
      default:
        return cat.toLowerCase().replace(/_/g, ' ');
    }
  };

  if (!isHost) return null;

  return (
    <div className="px-4">
      <div className="rounded-xl bg-background">
        <div className="flex items-center gap-x-2.5 p-4">
          <div className="rounded-md bg-blue-600 p-2 h-auto w-auto">
            <Pencil className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm lg:text-lg font-semibold capitalize">
              Edit your stream info
            </h2>
            <p className="text-muted-foreground text-xs lg:text-sm">
              Maximize your visibility
            </p>
          </div>
          <Link href={`/u/${user?.username}/settings`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
        <Separator />
        <div className="p-4 lg:p-6 space-y-4">
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">
              Name
            </h3>
            <p className="text-sm font-semibold">
              {name}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">
              Category
            </h3>
            <p className="text-sm font-semibold">
              {formatCategory(category)}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">
              Thumbnail
            </h3>
            {thumbnailUrl ? (
              <div className="relative aspect-video rounded-md overflow-hidden w-[200px] border border-white/10">
                <Image
                  fill
                  src={thumbnailUrl}
                  alt={name}
                  className="object-cover"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No thumbnail set</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
