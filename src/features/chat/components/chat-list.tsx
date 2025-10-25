"use client";

import { ReceivedChatMessage } from "@livekit/components-react";

import { Skeleton } from "@/components/ui/skeleton";

import { ChatMessage } from "./chat-message";

interface ChatListProps {
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
};

export const ChatList = ({
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
}: ChatListProps) => {
  if (isHidden || !messages || messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-white/50">
          {isHidden ? "Chat is disabled" : "Welcome to the chat!"}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col-reverse overflow-y-auto h-full">
      {messages.map((message) => {
        const isOwnMessage = message.from?.name === viewerName;
        const isBeingRepliedTo = replyMessage?.timestamp === message.timestamp;
        return (
          <ChatMessage
            key={message.timestamp}
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
          />
        );
      })}
    </div>
  );
};

export const ChatListSkeleton = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <Skeleton className="w-1/2 h-6" />
    </div>
  );
};
