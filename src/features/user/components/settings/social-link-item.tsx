"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Github, 
  Youtube, 
  Linkedin, 
  Instagram, 
  Twitter, 
  Facebook,
  GripVertical,
  Edit2,
  Trash2,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
type SocialPlatform = "GITHUB" | "YOUTUBE" | "LINKEDIN" | "INSTAGRAM" | "TWITTER" | "FACEBOOK";
import { updateSocialLink, deleteSocialLink } from "@/server/actions/social-links";

interface SocialLinkItemProps {
  id: string;
  platform: SocialPlatform;
  url: string;
  order: number;
}

const platformIcons = {
  GITHUB: Github,
  YOUTUBE: Youtube,
  LINKEDIN: Linkedin,
  INSTAGRAM: Instagram,
  TWITTER: Twitter,
  FACEBOOK: Facebook,
};

const platformColors = {
  GITHUB: "text-gray-300",
  YOUTUBE: "text-red-500",
  LINKEDIN: "text-blue-500",
  INSTAGRAM: "text-pink-500",
  TWITTER: "text-blue-400",
  FACEBOOK: "text-blue-600",
};

export function SocialLinkItem({ id, platform, url }: SocialLinkItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(url);
  const [isPending, startTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = platformIcons[platform];
  const iconColor = platformColors[platform];

  const handleSave = () => {
    if (editUrl === url) {
      setIsEditing(false);
      return;
    }

    if (!editUrl.trim()) {
      toast.error("URL cannot be empty");
      return;
    }

    startTransition(() => {
      updateSocialLink(id, editUrl.trim())
        .then(() => {
          toast.success(`${platform.toLowerCase()} link updated successfully`);
          setIsEditing(false);
        })
        .catch((error) => {
          console.error("SocialLinkItem - updateSocialLink error:", error);
          toast.error(error.message || "Failed to update link");
          setEditUrl(url); // Reset to original value
        });
    });
  };

  const handleCancel = () => {
    setEditUrl(url);
    setIsEditing(false);
  };

  const handleDelete = () => {
    startTransition(() => {
      deleteSocialLink(id)
        .then(() => {
          toast.success(`${platform.toLowerCase()} link removed successfully`);
        })
        .catch((error) => {
          console.error("SocialLinkItem - deleteSocialLink error:", error);
          toast.error(error.message || "Failed to delete link");
        });
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-4 bg-[#141517] rounded-lg transition-all duration-200 hover:bg-[#1A1B1F] shadow-sm",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-300 transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Platform Icon */}
      <div className="flex-shrink-0">
        <div className={cn("w-8 h-8 rounded-lg bg-[#141517] flex items-center justify-center", iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Platform Name */}
      <div className="flex-shrink-0 min-w-0">
        <span className="text-sm font-medium text-white capitalize">
          {platform.toLowerCase()}
        </span>
      </div>

      {/* URL Input/Display */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              disabled={isPending}
              className="bg-[#141517] border-none text-white placeholder-gray-400 focus:ring-[#0FA84E]/20 shadow-sm"
              placeholder={`Enter your ${platform.toLowerCase()} URL`}
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || !editUrl.trim()}
              className="bg-[#0FA84E] hover:bg-[#0FA84E]/90 text-white shadow-sm h-8 px-2"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="border-none text-gray-300 hover:text-white hover:bg-[#1A1B1F] h-8 px-2 shadow-sm"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300 truncate">
              {url}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white hover:bg-[#1A1B1F] h-6 px-1 shadow-sm"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete Button */}
      {!isEditing && (
        <div className="flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 px-1 shadow-sm"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
