"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
type SocialPlatform = "GITHUB" | "YOUTUBE" | "LINKEDIN" | "INSTAGRAM" | "TWITTER" | "FACEBOOK";
import { reorderSocialLinks } from "@/server/actions/social-links";
import { SocialLinkItem } from "./social-link-item";
import { AddSocialLinkDialog } from "./add-social-link-dialog";

interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  order: number;
}

interface SocialLinksCardProps {
  initialSocialLinks: SocialLink[];
}

export function SocialLinksCard({ initialSocialLinks }: SocialLinksCardProps) {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialSocialLinks);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort links by order
  const sortedLinks = [...socialLinks].sort((a, b) => a.order - b.order);
  const existingPlatforms = socialLinks.map(link => link.platform);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedLinks.findIndex((item) => item.id === active.id);
    const newIndex = sortedLinks.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state immediately for smooth UX
    const newOrder = arrayMove(sortedLinks, oldIndex, newIndex);
    setSocialLinks(newOrder.map((link, index) => ({ ...link, order: index })));
    setIsReordering(true);

    // Update order in database
    const linkIds = newOrder.map(link => link.id);
    reorderSocialLinks(linkIds)
      .then(() => {
        toast.success("Social links reordered successfully");
      })
      .catch((error) => {
        console.error("SocialLinksCard - reorderSocialLinks error:", error);
        toast.error("Failed to reorder social links");
        // Revert local state on error
        setSocialLinks(initialSocialLinks);
      })
      .finally(() => {
        setIsReordering(false);
      });
  };

  const handleLinkAdded = (newLink: { id: string; platform: SocialPlatform; url: string; order: number }) => {
    // Optimistically add the new link to the list
    setSocialLinks(prevLinks => [...prevLinks, newLink]);
  };

  return (
    <Card className="bg-transparent shadow-[0_0_10px_0_rgba(0,0,0,0.6)] border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Link2 className="w-5 h-5 text-[#0FA84E]" />
          Social Media Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        <div className="text-sm text-gray-400">
          Add your social media profiles to share with your audience. You can drag and drop to reorder them.
        </div>

        {/* Social Links List */}
        {sortedLinks.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={sortedLinks.map(link => link.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={cn(
                "space-y-3",
                isReordering && "opacity-75"
              )}>
                {sortedLinks.map((link) => (
                  <SocialLinkItem
                    key={link.id}
                    id={link.id}
                    platform={link.platform}
                    url={link.url}
                    order={link.order}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex items-center justify-center p-8 bg-[#141517]/50 rounded-lg shadow-sm">
            <div className="text-center">
              <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-2">No social links yet</h3>
              <p className="text-sm text-gray-400 mb-4">
                Add your social media profiles to connect with your audience
              </p>
            </div>
          </div>
        )}

        {/* Add Social Link Button */}
        <div className="pt-2">
          <AddSocialLinkDialog
            existingPlatforms={existingPlatforms}
            onLinkAdded={handleLinkAdded}
          />
        </div>

        {/* Help Text */}
        {sortedLinks.length > 0 && (
          <div className="text-xs text-gray-500 bg-[#141517]/50 rounded-lg p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-[#0FA84E] rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-400">
                  <strong>Tip:</strong> Drag the grip handle to reorder your social links. 
                  The order you set here will be displayed on your profile.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
