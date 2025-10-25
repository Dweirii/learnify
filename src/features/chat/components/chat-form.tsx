"use client";

import { useState, useRef } from "react";
import { ReceivedChatMessage } from "@livekit/components-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ChatInfo } from "./chat-info";
import { EmojiPicker } from "./emoji-picker";
import { ReplyPreview } from "./reply-preview";
import { MentionAutocomplete } from "./mention-autocomplete";

interface ChatFormProps {
  onSubmit: () => void;
  value: string;
  onChange: (value: string) => void;
  isHidden: boolean;
  isFollowersOnly: boolean;
  isFollowing: boolean;
  isDelayed: boolean;
  replyMessage?: ReceivedChatMessage | null;
  onCancelReply?: () => void;
  participants?: string[];
  onMentionClick?: (username: string) => void;
};

export const ChatForm = ({
  onSubmit,
  value,
  onChange,
  isHidden,
  isFollowersOnly,
  isFollowing,
  isDelayed,
  replyMessage,
  onCancelReply,
  participants = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMentionClick,
}: ChatFormProps) => {
  const [isDelayBlocked, setIsDelayBlocked] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFollowersOnlyAndNotFollowing = isFollowersOnly && !isFollowing;
  const isDisabled = isHidden || isDelayBlocked || isFollowersOnlyAndNotFollowing;

  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    onChange(newValue);

    // Check for @ mention
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch && participants.length > 0) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      
      // Calculate position for autocomplete
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setMentionPosition({
          top: rect.top - 200, // Position above input
          left: rect.left,
        });
      }
      
      setShowMentionAutocomplete(true);
    } else {
      setShowMentionAutocomplete(false);
    }
  };

  const handleMentionSelect = (username: string) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    
    // Replace @query with @username
    const newText = textBeforeCursor.replace(/@\w*$/, `@${username} `) + textAfterCursor;
    onChange(newText);
    
    setShowMentionAutocomplete(false);
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!value || isDisabled) return;

    if (isDelayed && !isDelayBlocked) {
      setIsDelayBlocked(true);
      setTimeout(() => {
        setIsDelayBlocked(false);
        onSubmit();
      }, 3000);
    } else {
      onSubmit();
    }
  }

  if (isHidden) {
    return null;
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className="border-t border-white/10 bg-[#141517]"
    >
      {/* Chat Info */}
      <ChatInfo
        isDelayed={isDelayed}
        isFollowersOnly={isFollowersOnly}
      />
      
      {/* Reply Preview */}
      {replyMessage && onCancelReply && (
        <div className="px-3 pt-3">
          <ReplyPreview 
            replyMessage={replyMessage} 
            onCancel={onCancelReply} 
          />
        </div>
      )}
      
      {/* Input Area */}
      <div className="px-3 pb-3">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              onChange={handleInputChange}
              value={value}
              disabled={isDisabled}
              placeholder="Send a message"
              className={cn(
                "bg-white/[0.03] border-white/[0.08] pr-10 text-white placeholder:text-white/40 focus-visible:border-white/20 focus-visible:ring-0 h-10 hover:bg-white/[0.05] transition-colors"
              )}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <EmojiPicker 
                onEmojiSelect={handleEmojiSelect}
                disabled={isDisabled}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isDisabled}
            className="bg-[#0FA851] hover:bg-[#0FA851]/90 text-white font-semibold h-10 px-6 transition-all"
          >
            Send
          </Button>
        </div>

        {/* Mention Autocomplete */}
        {showMentionAutocomplete && (
          <MentionAutocomplete
            query={mentionQuery}
            participants={participants}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentionAutocomplete(false)}
            position={mentionPosition}
          />
        )}
      </div>
    </form>
  );
};

export const ChatFormSkeleton = () => {
  return (
    <div className="border-t border-white/10 bg-[#141517] p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="flex-1 h-10" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
};
