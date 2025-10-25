"use client";

import { Github, Youtube, Linkedin, Instagram, Twitter, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";
import { SocialLink } from "@/types";

interface SocialLinksProps {
  socialLinks: SocialLink[];
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
  GITHUB: "hover:text-gray-300",
  YOUTUBE: "hover:text-red-500",
  LINKEDIN: "hover:text-blue-500",
  INSTAGRAM: "hover:text-pink-500",
  TWITTER: "hover:text-blue-400",
  FACEBOOK: "hover:text-blue-600",
};

export const SocialLinks = ({ socialLinks }: SocialLinksProps) => {
  if (!socialLinks || socialLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {socialLinks.map((link) => {
        const Icon = platformIcons[link.platform as keyof typeof platformIcons];
        const hoverColor = platformColors[link.platform as keyof typeof platformColors];

        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center",
              "text-muted-foreground transition-all duration-200",
              "hover:bg-muted hover:scale-110",
              hoverColor
            )}
            title={`Visit ${link.platform.toLowerCase()} profile`}
          >
            <Icon className="w-4 h-4" />
          </a>
        );
      })}
    </div>
  );
};
