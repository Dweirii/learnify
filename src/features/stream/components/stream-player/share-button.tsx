"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2, Copy, Twitter, Facebook, Linkedin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonProps {
  hostName: string;
  streamUrl: string;
}

export const ShareButton = ({ hostName, streamUrl }: ShareButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(streamUrl);
      toast.success("Link copied to clipboard!");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShareToTwitter = () => {
    const text = `Check out ${hostName}'s stream on Learnify!`;
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(streamUrl)}&text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleShareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(streamUrl)}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleShareToLinkedIn = () => {
    const text = `Check out ${hostName}'s stream on Learnify!`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(text)}`;
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full lg:w-auto gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-[#141517] rounded-xl shadow-xl p-0">
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            <DropdownMenuItem 
              onClick={handleCopyLink} 
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[#272A33] focus:bg-[#272A33] transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1F2127] flex items-center justify-center">
                <Copy className="h-5 w-5 text-gray-300" />
              </div>
              <span className="text-gray-300 text-xs font-medium">Copy</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleShareToTwitter} 
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[#272A33] focus:bg-[#272A33] transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1F2127] flex items-center justify-center">
                <Twitter className="h-5 w-5 text-gray-300" />
              </div>
              <span className="text-gray-300 text-xs font-medium">Twitter</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleShareToFacebook} 
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[#272A33] focus:bg-[#272A33] transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1F2127] flex items-center justify-center">
                <Facebook className="h-5 w-5 text-gray-300" />
              </div>
              <span className="text-gray-300 text-xs font-medium">Facebook</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleShareToLinkedIn} 
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[#272A33] focus:bg-[#272A33] transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1F2127] flex items-center justify-center">
                <Linkedin className="h-5 w-5 text-gray-300" />
              </div>
              <span className="text-gray-300 text-xs font-medium">LinkedIn</span>
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
