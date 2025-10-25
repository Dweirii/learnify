"use client";

import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EMOJI_DATA, EMOJI_CATEGORIES, type EmojiCategory } from "@/lib/emoji-data";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export const EmojiPicker = ({ onEmojiSelect, disabled = false }: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EmojiCategory>("smileys");
  const [searchQuery, setSearchQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close picker on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
    setSearchQuery("");
  };

  const getFilteredEmojis = () => {
    if (searchQuery.trim()) {
      return EMOJI_DATA.filter((emoji) =>
        emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emoji.keywords.some((keyword) =>
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    return EMOJI_DATA.filter((emoji) => emoji.category === selectedCategory);
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <div className="relative" ref={pickerRef}>
      {/* Emoji Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "h-8 w-8 p-0 hover:bg-white/10 transition-colors",
          isOpen && "bg-white/10"
        )}
      >
        <Smile className="h-4 w-4 text-white/70" />
      </Button>

      {/* Emoji Picker Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-[#141517] rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)] z-50">
          {/* Header */}
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Choose Emoji</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 hover:bg-white/10"
              >
                ×
              </Button>
            </div>
            
            {/* Search */}
            <input
              type="text"
              placeholder="Search emojis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-[#141517] border border-white/10 rounded-md text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0FA851]/50 focus:border-[#0FA851]"
            />
          </div>

          {/* Categories */}
          {!searchQuery && (
            <div className="flex items-center gap-1 p-2 border-b border-white/10 overflow-x-auto">
              {EMOJI_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "h-8 w-8 p-0 flex-shrink-0 hover:bg-[#0FA851]/20 transition-colors",
                    selectedCategory === category.id && "bg-[#0FA851]/20"
                  )}
                >
                  <span className="text-lg">{category.icon}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Emojis Grid */}
          <div className="p-3 max-h-64 overflow-y-auto">
            {filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-8 gap-1">
                {filteredEmojis.map((emojiData, index) => (
                  <Button
                    key={`${emojiData.emoji}-${index}`}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEmojiClick(emojiData.emoji)}
                    className="h-8 w-8 p-0 hover:bg-[#0FA851]/20 transition-colors"
                    title={emojiData.name}
                  >
                    <span className="text-lg">{emojiData.emoji}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-white/40">No emojis found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-white/10">
            <p className="text-xs text-white/50 text-center">
              {searchQuery ? `${filteredEmojis.length} emojis found` : `${filteredEmojis.length} emojis`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
