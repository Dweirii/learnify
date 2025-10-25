"use client";

import { cn } from "@/lib/utils";
import { parseMessage, type MessagePart } from "@/lib/message-parser";

interface MessageContentProps {
  message: string;
  validUsernames?: string[];
  onMentionClick?: (username: string) => void;
}

export const MessageContent = ({ 
  message, 
  validUsernames = [],
  onMentionClick 
}: MessageContentProps) => {
  const parsedMessage = parseMessage(message, validUsernames);

  const renderPart = (part: MessagePart, index: number) => {
    switch (part.type) {
      case "text":
        return (
          <span key={index} className="text-sm text-white/90 break-words leading-relaxed">
            {part.content}
          </span>
        );

      case "mention":
        return (
          <button
            key={index}
            type="button"
            onClick={() => onMentionClick?.(part.username)}
            className="text-sm font-semibold text-white/90 hover:text-white hover:underline cursor-pointer break-words"
          >
            @{part.username}
          </button>
        );

      case "url":
        return (
          <a
            key={index}
            href={part.isValid ? part.url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-sm break-words inline-flex items-center gap-1",
              part.isValid 
                ? "text-white/70 hover:text-white hover:underline" 
                : "text-red-400 cursor-not-allowed"
            )}
            onClick={(e) => {
              if (!part.isValid) {
                e.preventDefault();
              }
            }}
            title={part.isValid ? `Visit ${part.domain}` : "Invalid URL"}
          >
            {part.url}
            {part.isValid && (
              <span className="text-xs text-white/40">
                ({part.domain})
              </span>
            )}
          </a>
        );

      case "emoji":
        return (
          <span key={index} className="text-base">
            {part.emoji}
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap items-baseline gap-1 leading-relaxed">
      {parsedMessage.parts.map((part, index) => renderPart(part, index))}
    </div>
  );
};
