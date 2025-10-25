"use client";

import Image from "next/image";
import { StreamCategory } from "@prisma/client";

interface InfoCardProps {
  name: string;
  thumbnailUrl: string | null;
  hostIdentity: string;
  viewerIdentity: string;
  category: StreamCategory | null;
};

export const InfoCard = ({
  name,
  thumbnailUrl,
  hostIdentity,
  viewerIdentity,
  category,
}: InfoCardProps) => {
  const hostAsViewer = `host-${hostIdentity}`;
  const isHost = viewerIdentity === hostAsViewer;

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
        return String(cat).toLowerCase().replace(/_/g, ' ');
    }
  };

  if (!isHost) return null;

  return (
    <div className="px-4">
      <div className="rounded-xl bg-[#141517] border-none shadow-[0_-4px_20px_0_rgba(0,0,0,0.3)]">
        <div className="p-4 lg:p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm lg:text-lg font-semibold capitalize text-white mb-1">
                Edit your stream info
              </h2>
              <p className="text-gray-400 text-xs lg:text-sm">
                Maximize your visibility
              </p>
            </div>
            <div className="border-t border-gray-700/50 pt-4"></div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-400 mb-2">
                  Name
                </h3>
                <p className="text-sm font-semibold text-white">
                  {name}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-2">
                  Category
                </h3>
                <p className="text-sm font-semibold text-white">
                  {formatCategory(category)}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-2">
                  Thumbnail
                </h3>
                {thumbnailUrl ? (
                  <div className="relative aspect-video rounded-md overflow-hidden w-[200px] border border-gray-600">
                    <Image
                      fill
                      src={thumbnailUrl}
                      alt={name}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No thumbnail set</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
