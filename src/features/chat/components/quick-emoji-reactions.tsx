"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "./emoji-picker";

interface QuickEmojiReactionsProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export const QuickEmojiReactions = ({
  onEmojiSelect,
  disabled = false,
}: QuickEmojiReactionsProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleQuickEmoji = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  const handleEmojiPickerSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setShowEmojiPicker(false);
  };

  if (disabled) return null;

  return (
    <div className="flex items-center gap-1 group-hover:opacity-100 opacity-0 transition-opacity duration-200">
      {/* Quick emoji buttons */}
      {QUICK_EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleQuickEmoji(emoji)}
          className="h-6 w-6 p-0 hover:bg-[#0FA851]/20 text-xs hover:scale-110 transition-all duration-150"
        >
          {emoji}
        </Button>
      ))}
      
      {/* More emojis button */}
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="h-6 w-6 p-0 hover:bg-[#0FA851]/20 hover:scale-110 transition-all duration-150"
        >
          <Smile className="h-3 w-3 text-white/60" />
        </Button>
        
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 z-50">
            <EmojiPicker
              onEmojiSelect={handleEmojiPickerSelect}
              disabled={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
