"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MentionAutocompleteProps {
  query: string;
  participants: string[];
  onSelect: (username: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export const MentionAutocomplete = ({
  query,
  participants,
  onSelect,
  onClose,
  position,
}: MentionAutocompleteProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Filter participants based on query
  const filteredParticipants = participants.filter((participant) =>
    participant.toLowerCase().includes(query.toLowerCase())
  );

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!filteredParticipants.length) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => 
            prev < filteredParticipants.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : filteredParticipants.length - 1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (filteredParticipants[selectedIndex]) {
            onSelect(filteredParticipants[selectedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredParticipants, selectedIndex, onSelect, onClose]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!filteredParticipants.length) {
    return null;
  }

  return (
    <div
      ref={autocompleteRef}
      className="absolute z-50 w-64 bg-[#141517] rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)]"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-2">
        <div className="text-xs text-white/50 mb-2 px-2">
          {filteredParticipants.length} participant{filteredParticipants.length !== 1 ? 's' : ''} found
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filteredParticipants.map((participant, index) => (
            <Button
              key={`${participant}-${index}`}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelect(participant)}
              className={cn(
                "w-full justify-start gap-2 h-8 hover:bg-[#0FA851]/20 text-white text-sm",
                index === selectedIndex && "bg-[#0FA851]/20"
              )}
            >
              <div className="w-6 h-6 bg-[#0FA851] rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {participant.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="truncate">{participant}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
