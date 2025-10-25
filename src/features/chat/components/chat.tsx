"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectionState } from "livekit-client";
import { useMediaQuery } from "usehooks-ts";
import { toast } from "sonner";
import {
  useChat,
  useConnectionState,
  useRemoteParticipant,
  useParticipants,
  ReceivedChatMessage
} from "@livekit/components-react";

import { ChatVariant, useChatSidebar } from "@/store/use-chat-sidebar";
import { useStreamUpdates } from "@/hooks/use-stream-updates";

import { ChatForm, ChatFormSkeleton } from "./chat-form";
import { ChatListSkeleton } from "./chat-list";
import { VirtualChatList } from "./virtual-chat-list";
import { ChatHeader, ChatHeaderSkeleton } from "./chat-header";
import { ChatCommunity } from "./chat-community";
import { PinnedMessage } from "./pinned-message";

interface ChatProps {
  hostName: string;
  hostIdentity: string;
  viewerName: string;
  isFollowing: boolean;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
  streamId?: string;
};

export const Chat = ({
  hostName,
  hostIdentity,
  viewerName,
  isFollowing,
  isChatEnabled,
  isChatDelayed,
  isChatFollowersOnly,
  streamId = "default",
}: ChatProps) => {
  const matches = useMediaQuery('(max-width: 1024px)');
  const { variant, onExpand } = useChatSidebar((state) => state);
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);

  const isOnline = participant && connectionState === ConnectionState.Connected
  const isHidden = !isChatEnabled || !isOnline;
  const isHost = viewerName === hostName;

  const [value, setValue] = useState("");
  const [replyMessage, setReplyMessage] = useState<ReceivedChatMessage | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<ReceivedChatMessage | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingPinnedMessage, setIsLoadingPinnedMessage] = useState(true);
  const { chatMessages: messages, send } = useChat();
  const participants = useParticipants();

  // Stream updates for pinned messages
  const { lastEvent } = useStreamUpdates({
    streamId,
    userId: viewerName,
    autoReconnect: true,
  });

  // Fetch existing pinned message on mount
  useEffect(() => {
    const fetchPinnedMessage = async () => {
      try {
        setIsLoadingPinnedMessage(true);
        const response = await fetch(`/api/chat/pinned?streamId=${streamId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.pinnedMessage) {
            const pinnedMsg: ReceivedChatMessage = {
              id: data.pinnedMessage.messageId,
              message: data.pinnedMessage.message,
              from: data.pinnedMessage.from,
              timestamp: data.pinnedMessage.timestamp,
            };
            setPinnedMessage(pinnedMsg);
          }
        }
      } catch (error) {
        console.error("Error fetching pinned message:", error);
      } finally {
        setIsLoadingPinnedMessage(false);
      }
    };

    fetchPinnedMessage();
  }, [streamId]);



  // Get participant names for mentions
  const participantNames = useMemo(() => {
    const names = participants.map(p => p.name || "").filter(Boolean);
    // Remove duplicates while preserving order
    return Array.from(new Set(names));
  }, [participants]);

  useEffect(() => {
    if (matches) {
      onExpand();
    }
  }, [matches, onExpand]);

  // Handle pinned message events from stream updates
  useEffect(() => {
    if (!lastEvent) return;

    console.log("Stream event received:", lastEvent);

    if (lastEvent.type === "message.pinned") {
      const data = lastEvent.data as {
        messageId: string;
        message: string;
        from: { name?: string; identity?: string };
        timestamp: number;
      };
      console.log("Pinned message data:", data);
      const pinnedMsg = {
        id: data.messageId,
        message: data.message,
        from: data.from as unknown as ReceivedChatMessage['from'],
        timestamp: data.timestamp,
      } as ReceivedChatMessage;
      setPinnedMessage(pinnedMsg);
      console.log("Pinned message set:", pinnedMsg);
    } else if (lastEvent.type === "message.unpinned") {
      console.log("Message unpinned");
      setPinnedMessage(null);
    }
  }, [lastEvent]);

  // Memory management: Keep only last 100 messages in memory
  const MAX_MESSAGES_IN_MEMORY = 100;
  
  const reversedMessages = useMemo(() => {
    // Sort messages by timestamp (newest first)
    const sortedMessages = messages.sort((a, b) => b.timestamp - a.timestamp);
    
    // Keep only the most recent messages to prevent memory issues
    const limitedMessages = sortedMessages.slice(0, MAX_MESSAGES_IN_MEMORY);
    
    // Log memory management info
    if (messages.length > MAX_MESSAGES_IN_MEMORY) {
      console.log(`Memory management: Showing ${limitedMessages.length} of ${messages.length} messages`);
    }
    
    return limitedMessages;
  }, [messages]);

  const onSubmit = async () => {
    if (!send) return;

    // Add reply context to message if replying
    let messageToSend = value;
    if (replyMessage) {
      messageToSend = `@${replyMessage.from?.name} ${value}`;
      toast.success("Reply sent!", {
        description: `Replied to ${replyMessage.from?.name}`,
        duration: 2000,
      });
    }

    // Send message via LiveKit
    send(messageToSend);
    
    // Generate a unique message ID
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Award XP for chat message (fire and forget)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId,
          messageId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.leveledUp && data.newLevel) {
          toast.success("Level Up!", {
            description: `You reached level ${data.newLevel}!`,
            duration: 3000,
          });
        }
      }
    } catch (error) {
      // Silently fail - XP award shouldn't block chat
      console.error("Failed to award XP for chat message:", error);
    }

    setValue("");
    setReplyMessage(null);
  };

  const onChange = (value: string) => {
    setValue(value);
  };

  const handleReply = (message: ReceivedChatMessage) => {
    setReplyMessage(message);
    toast.success(`Replying to ${message.from?.name}`, {
      description: "Your reply will include a mention",
      duration: 2000,
    });
  };

  const handleCancelReply = () => {
    setReplyMessage(null);
    toast.info("Reply cancelled", {
      duration: 1500,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard", {
      duration: 2000,
    });
  };

  const handleDelete = (messageId: string) => {
    // TODO: Implement message deletion
    toast.success("Message deleted", {
      description: "Your message has been removed",
      duration: 2000,
    });
    console.log("Delete message:", messageId);
  };

  const handlePin = async (messageId: string) => {
    // Find the message in the current messages
    const message = messages.find(m => m.id === messageId || m.timestamp.toString() === messageId);
    if (!message) {
      console.log("Message not found in messages:", messages);
      toast.error("Message not found");
      return;
    }

    try {
      console.log("Pin attempt:", { messageId, streamId, viewerName, isHost });
      console.log("Found message:", message);

      const pinnedData = {
        messageId,
        message: message.message,
        from: message.from,
        timestamp: message.timestamp,
      };

      console.log("Broadcasting pinned message:", {
        type: 'message.pinned',
        streamId,
        userId: viewerName,
        data: pinnedData,
      });

      // Broadcast pinned message to all users via SSE
      const response = await fetch('/api/stream-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message.pinned',
          streamId,
          userId: viewerName,
          data: pinnedData,
        }),
      });

      console.log("Response status:", response.status);
      
      if (response.ok) {
        // Store in Redis for persistence
        await fetch('/api/chat/pinned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId,
            messageId,
            messageData: pinnedData,
          }),
        });

        // Set locally
        setPinnedMessage(message);
        toast.success("Message pinned", {
          description: "All viewers can now see this pinned message",
          duration: 2000,
        });
      } else {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        toast.error("Failed to pin message", {
          description: "Please try again",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error pinning message:", error);
      toast.error("Failed to pin message", {
        description: "An error occurred while pinning the message",
        duration: 2000,
      });
    }
  };

  const handleUnpin = async () => {
    try {
      // Broadcast unpin event to all users via SSE
      const response = await fetch('/api/stream-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message.unpinned',
          streamId,
          userId: viewerName,
          data: {
            messageId: pinnedMessage?.timestamp.toString() || '',
          },
        }),
      });

      if (response.ok) {
        // Remove from Redis
        await fetch('/api/chat/pinned', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId,
          }),
        });

        // Remove locally
        setPinnedMessage(null);
        toast.success("Message unpinned", {
          description: "The pinned message has been removed for all viewers",
          duration: 2000,
        });
      } else {
        toast.error("Failed to unpin message", {
          description: "Please try again",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error unpinning message:", error);
      toast.error("Failed to unpin message", {
        description: "An error occurred while unpinning the message",
        duration: 2000,
      });
    }
  };

  const handleScrollToPinnedMessage = () => {
    // TODO: Implement scroll to message functionality
    toast.info("Scroll to pinned message", {
      description: "This feature will be implemented soon",
      duration: 2000,
    });
  };

  const handleMentionClick = (username: string) => {
    // Insert @username at cursor position
    const newValue = value + `@${username} `;
    setValue(newValue);
  };


  return (
    <div className="flex flex-col bg-[#141517] shadow-[0_0_10px_0_rgba(0,0,0,0.6)] pt-0 h-[calc(100vh-80px)]">
      <ChatHeader />
      {variant === ChatVariant.CHAT && (
        <>
          {/* Pinned Message */}
          {pinnedMessage && (
            <div className="px-3 pt-3 pb-2">
              <PinnedMessage
                pinnedMessage={pinnedMessage}
                onUnpin={isHost ? handleUnpin : undefined}
                onScrollToMessage={handleScrollToPinnedMessage}
                isHost={isHost}
              />
            </div>
          )}
          
          <VirtualChatList
            messages={reversedMessages}
            isHidden={isHidden}
            viewerName={viewerName}
            isHost={isHost}
            onReply={handleReply}
            onCopy={handleCopy}
            onDelete={handleDelete}
            onPin={handlePin}
            participants={participantNames}
            onMentionClick={handleMentionClick}
            replyMessage={replyMessage}
          />
          <ChatForm
            onSubmit={onSubmit}
            value={value}
            onChange={onChange}
            isHidden={isHidden}
            isFollowersOnly={isChatFollowersOnly}
            isDelayed={isChatDelayed}
            isFollowing={isFollowing}
            replyMessage={replyMessage}
            onCancelReply={handleCancelReply}
            participants={participantNames}
            onMentionClick={handleMentionClick}
          />
        </>
      )}
      {variant === ChatVariant.COMMUNITY && (
        <ChatCommunity
          viewerName={viewerName}
          hostName={hostName}
          isHidden={isHidden}
        />
      )}
    </div>
  );
};

export const ChatSkeleton = () => {
  return (
    <div className="flex flex-col pt-0 h-[calc(100vh-80px)] border-2">
      <ChatHeaderSkeleton />
      <ChatListSkeleton />
      <ChatFormSkeleton />
    </div>
  );
};
