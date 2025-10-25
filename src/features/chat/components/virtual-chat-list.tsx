"use client";

import { useRef, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ReceivedChatMessage } from "@livekit/components-react";

import { ChatMessage } from "./chat-message";

interface VirtualChatListProps {
  messages: ReceivedChatMessage[];
  isHidden: boolean;
  viewerName?: string;
  isHost?: boolean;
  onReply?: (message: ReceivedChatMessage) => void;
  onCopy?: (text: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  participants?: string[];
  onMentionClick?: (username: string) => void;
  replyMessage?: ReceivedChatMessage | null;
}

export const VirtualChatList = ({
  messages,
  isHidden,
  viewerName,
  isHost,
  onReply,
  onCopy,
  onDelete,
  onPin,
  participants = [],
  onMentionClick,
  replyMessage,
}: VirtualChatListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Reverse messages for chat (newest at bottom)
  const reversedMessages = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  const virtualizer = useVirtualizer({
    count: reversedMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated height per message
    overscan: 5, // Render 5 extra items for smooth scrolling
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (reversedMessages.length > 0) {
      virtualizer.scrollToIndex(reversedMessages.length - 1, {
        align: "end",
        behavior: "smooth",
      });
    }
  }, [reversedMessages.length, virtualizer]);

  if (isHidden || !messages || messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-white/50">
          {isHidden ? "Chat is disabled" : "Welcome to the chat!"}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="flex flex-1 flex-col overflow-y-auto h-full"
      style={{
        height: "100%",
        overflow: "auto",
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = reversedMessages[virtualItem.index];
          const isOwnMessage = message.from?.name === viewerName;
          const isBeingRepliedTo = replyMessage?.timestamp === message.timestamp;

          return (
            <div
              key={message.timestamp}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ChatMessage
                data={message}
                isOwnMessage={isOwnMessage}
                isHost={isHost}
                onReply={onReply}
                onCopy={onCopy}
                onDelete={onDelete}
                onPin={onPin}
                participants={participants}
                onMentionClick={onMentionClick}
                isBeingRepliedTo={isBeingRepliedTo}
                isHidden={isHidden}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
