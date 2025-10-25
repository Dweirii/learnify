"use client";

import { Pin, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReceivedChatMessage } from "@livekit/components-react";
import stringToColor from "string-to-color";

interface PinnedMessageProps {
  pinnedMessage: ReceivedChatMessage | null;
  onUnpin?: () => void;
  onScrollToMessage?: () => void;
  isHost?: boolean;
}

export const PinnedMessage = ({ 
  pinnedMessage, 
  onUnpin, 
  isHost = false 
}: PinnedMessageProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!pinnedMessage) return null;

  const senderColor = stringToColor(pinnedMessage.from?.name || "");
  const isLongMessage = pinnedMessage.message.length > 100;
  const messagePreview = isExpanded 
    ? pinnedMessage.message 
    : (isLongMessage ? `${pinnedMessage.message.slice(0, 100)}...` : pinnedMessage.message);

  return (
    <div className="relative group">
      <div className="relative bg-[#141517] rounded-lg overflow-hidden shadow-[0_0_10px_0_rgba(0,0,0,0.6)] animate-in slide-in-from-top-2 duration-300">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0FA851]" />
        
        <div className="p-3">
          {/* Pin Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="relative w-6 h-6 bg-[#0FA851]/20 border border-[#0FA851]/30 rounded-full flex items-center justify-center">
                  <Pin className="w-3.5 h-3.5 text-[#0FA851]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#0FA851]">
                  Pinned Message
                </span>
                <span className="text-[10px] text-white/40">
                  Visible to all viewers
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isLongMessage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-7 w-7 p-0 hover:bg-white/10 transition-all duration-200 rounded-md"
                  title={isExpanded ? "Show less" : "Show more"}
                >
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-white/60 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )} />
                </Button>
              )}
              
              {isHost && onUnpin && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnpin();
                  }}
                  className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/20 border border-transparent transition-all duration-200 rounded-md"
                  title="Unpin message"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Pinned Content */}
          <div className="flex items-start gap-2.5 pl-1">
            {/* Sender Name */}
            <div className="flex-shrink-0">
              <span 
                className="text-sm font-bold truncate max-w-32 drop-shadow-lg"
                style={{ color: senderColor }}
              >
                {pinnedMessage.from?.name}:
              </span>
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm text-white/80 break-words leading-relaxed",
                !isExpanded && isLongMessage && "line-clamp-2"
              )}>
                {messagePreview}
              </p>
            </div>
          </div>

          {/* Footer info */}
          {isHost && (
            <div className="mt-2.5 pt-2 border-t border-white/5">
              <p className="text-[10px] text-white/30 italic">
                Only you can unpin this message
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
