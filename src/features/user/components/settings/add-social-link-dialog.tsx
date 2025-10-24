"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { 
  Github, 
  Youtube, 
  Linkedin, 
  Instagram, 
  Twitter, 
  Facebook,
  Plus,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
type SocialPlatform = "GITHUB" | "YOUTUBE" | "LINKEDIN" | "INSTAGRAM" | "TWITTER" | "FACEBOOK";
import { addSocialLink } from "@/server/actions/social-links";

interface AddSocialLinkDialogProps {
  existingPlatforms: SocialPlatform[];
  onLinkAdded: (newLink: { id: string; platform: SocialPlatform; url: string; order: number }) => void;
}

const platformOptions = [
  {
    value: "GITHUB" as SocialPlatform,
    label: "GitHub",
    icon: Github,
    color: "text-gray-300",
    placeholder: "https://github.com/username",
    description: "Share your code repositories"
  },
  {
    value: "YOUTUBE" as SocialPlatform,
    label: "YouTube",
    icon: Youtube,
    color: "text-red-500",
    placeholder: "https://youtube.com/@username",
    description: "Share your video content"
  },
  {
    value: "LINKEDIN" as SocialPlatform,
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-500",
    placeholder: "https://linkedin.com/in/username",
    description: "Share your professional profile"
  },
  {
    value: "INSTAGRAM" as SocialPlatform,
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    placeholder: "https://instagram.com/username",
    description: "Share your visual content"
  },
  {
    value: "TWITTER" as SocialPlatform,
    label: "Twitter/X",
    icon: Twitter,
    color: "text-blue-400",
    placeholder: "https://twitter.com/username",
    description: "Share your thoughts and updates"
  },
  {
    value: "FACEBOOK" as SocialPlatform,
    label: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    placeholder: "https://facebook.com/username",
    description: "Share your social presence"
  },
];

export function AddSocialLinkDialog({ existingPlatforms, onLinkAdded }: AddSocialLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | "">("");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const availablePlatforms = platformOptions.filter(
    platform => !existingPlatforms.includes(platform.value)
  );

  const selectedPlatformOption = platformOptions.find(
    platform => platform.value === selectedPlatform
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlatform || !url.trim()) {
      toast.error("Please select a platform and enter a URL");
      return;
    }

    startTransition(() => {
      addSocialLink(selectedPlatform, url.trim())
        .then((newLink) => {
          toast.success(`${selectedPlatformOption?.label} link added successfully`);
          setOpen(false);
          setSelectedPlatform("");
          setUrl("");
          onLinkAdded(newLink);
        })
        .catch((error) => {
          console.error("AddSocialLinkDialog - addSocialLink error:", error);
          toast.error(error.message || "Failed to add social link");
        });
    });
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedPlatform("");
    setUrl("");
  };

  if (availablePlatforms.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-800/30 rounded-lg border border-gray-700">
        <div className="text-center">
          <LinkIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">All social platforms added</p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full border-none text-gray-300 hover:text-white hover:bg-[#1A1B1F] transition-all duration-200 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Social Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#141517] border-none shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-[#0FA84E]" />
            Add Social Link
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect your social media profiles to share with your audience
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform" className="text-white">Platform</Label>
            <Select
              value={selectedPlatform}
              onValueChange={(value) => {
                setSelectedPlatform(value as SocialPlatform);
                setUrl(""); // Clear URL when platform changes
              }}
              disabled={isPending}
            >
              <SelectTrigger className="w-full bg-[#141517] border-none text-white focus:ring-[#0FA84E]/20 shadow-sm">
                <SelectValue placeholder="Select a platform">
                  {selectedPlatform && selectedPlatformOption && (
                    <div className="flex items-center gap-3">
                      <div className={cn("w-5 h-5 rounded-md bg-[#141517] flex items-center justify-center", selectedPlatformOption.color)}>
                        <selectedPlatformOption.icon className="w-3 h-3" />
                      </div>
                      <span>{selectedPlatformOption.label}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#141517] border-none shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
                {availablePlatforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <SelectItem 
                      key={platform.value} 
                      value={platform.value}
                      className="text-white hover:bg-[#1A1B1F] focus:bg-[#1A1B1F]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-6 h-6 rounded-md bg-[#141517] flex items-center justify-center", platform.color)}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="font-medium">{platform.label}</div>
                          <div className="text-xs text-gray-400">{platform.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* URL Input */}
          {selectedPlatform && (
            <div className="space-y-2">
              <Label htmlFor="url" className="text-white">URL</Label>
              <div className="space-y-2">
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isPending}
                  placeholder={selectedPlatformOption?.placeholder}
                  className="bg-[#141517] border-none text-white placeholder-gray-400 focus:ring-[#0FA84E]/20 shadow-sm"
                />
                {selectedPlatformOption && (
                  <p className="text-xs text-gray-400">
                    Example: {selectedPlatformOption.placeholder}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {selectedPlatform && selectedPlatformOption && url && (
            <div className="p-3 bg-[#141517]/50 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg bg-[#141517] flex items-center justify-center", selectedPlatformOption.color)}>
                  <selectedPlatformOption.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {selectedPlatformOption.label}
                  </div>
                  <div className="text-xs text-gray-300 truncate">
                    {url}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="border-none text-gray-300 hover:text-white hover:bg-[#1A1B1F] shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedPlatform || !url.trim()}
              className="bg-[#0FA84E] hover:bg-[#0FA84E]/90 text-white shadow-lg hover:shadow-[#0FA84E]/25 transition-all duration-200"
            >
              {isPending ? "Adding..." : "Add Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
