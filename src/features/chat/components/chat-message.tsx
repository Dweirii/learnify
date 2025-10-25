"use client";

import { format } from "date-fns";
import { ReceivedChatMessage } from "@livekit/components-react";

import stringToColor from "string-to-color";
import { cn } from "@/lib/utils";
import { MessageActions } from "./message-actions";
import { MessageContent } from "./message-content";

interface ChatMessageProps {
  data: ReceivedChatMessage;
  isOwnMessage?: boolean;
  isHost?: boolean;
  onReply?: (message: ReceivedChatMessage) => void;
  onCopy?: (text: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  isPinned?: boolean;
  participants?: string[];
  onMentionClick?: (username: string) => void;
  isBeingRepliedTo?: boolean;
  onEmojiReaction?: (messageId: string, emoji: string) => void;
  isHidden?: boolean;
};

export const ChatMessage = ({
  data,
  isOwnMessage = false,
  isHost = false,
  onReply,
  onCopy,
  onDelete,
  onPin,
  isPinned = false,
  participants = [],
  onMentionClick,
  isBeingRepliedTo = false,
}: ChatMessageProps) => {
  const color = stringToColor(data.from?.name || "");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onCopy?.(text);
  };

  return (
    <div className={cn(
      "relative flex gap-3 px-3 py-2 group transition-all duration-200",
      isBeingRepliedTo && "bg-white/5"
    )}>
      {isBeingRepliedTo && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0FA851]" />
      )}
      
      <div className="flex flex-col gap-1 grow min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-bold whitespace-nowrap" style={{ color: color }}>
            {data.from?.name}
          </p>
          <p className="text-xs text-white/30">
            {format(data.timestamp, "HH:mm")}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <MessageContent 
            message={data.message}
            validUsernames={participants}
            onMentionClick={onMentionClick}
          />
          
          {/* Message Actions - Inline with message */}
          {(onReply || onCopy || onDelete || onPin) && (
            <MessageActions
              message={data}
              isOwnMessage={isOwnMessage}
              isHost={isHost}
              onReply={onReply || (() => {})}
              onCopy={handleCopy}
              onDelete={onDelete}
              onPin={onPin}
              isPinned={isPinned}
            />
          )}
        </div>
      </div>
    </div>
  );
};
