"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Reply, Trash2, MoreHorizontal, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReceivedChatMessage } from "@livekit/components-react";

interface MessageActionsProps {
  message: ReceivedChatMessage;
  isOwnMessage: boolean;
  isHost: boolean;
  onReply: (message: ReceivedChatMessage) => void;
  onCopy: (text: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  isPinned?: boolean;
}

export const MessageActions = ({
  message,
  isOwnMessage,
  isHost,
  onReply,
  onCopy,
  onDelete,
  onPin,
  isPinned = false,
}: MessageActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowActions(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      if (!isOpen) {
        setShowActions(false);
      }
    }, 150);
  };

  const handleReply = () => {
    onReply(message);
    setIsOpen(false);
  };

  const handleCopy = () => {
    onCopy(message.message);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (onDelete && isOwnMessage) {
      onDelete(message.id || message.timestamp.toString());
    }
    setIsOpen(false);
  };

  const handlePin = () => {
    if (onPin && isHost) {
      onPin(message.id || message.timestamp.toString());
    }
    setIsOpen(false);
  };

  const canDelete = isOwnMessage && onDelete;
  const canPin = isHost && onPin;

  return (
    <div
      ref={actionsRef}
      className={cn(
        "relative flex items-center gap-1 transition-all duration-200 z-10 ml-auto flex-shrink-0",
        "opacity-0 group-hover:opacity-100",
        showActions || isOpen ? "opacity-100" : ""
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Actions Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="h-6 w-6 p-0 hover:bg-white/10 bg-transparent transition-all duration-200 rounded"
        style={{ pointerEvents: 'auto' }}
      >
        <MoreHorizontal className="h-3.5 w-3.5 text-white/60" />
      </Button>

      {/* Actions Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-52 bg-[#141517] rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)] z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-1">
            {/* Reply */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleReply();
              }}
              className="w-full justify-start gap-3 h-9 hover:bg-white/10 text-white transition-colors cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            >
              <Reply className="h-4 w-4" />
              <span className="font-medium">Reply</span>
            </Button>

            {/* Copy */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCopy();
              }}
              className="w-full justify-start gap-3 h-9 hover:bg-white/10 text-white transition-colors cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            >
              <Copy className="h-4 w-4" />
              <span className="font-medium">Copy</span>
            </Button>

            {/* Pin/Unpin (Host only) */}
            {canPin && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePin();
                }}
                className="w-full justify-start gap-3 h-9 hover:bg-white/10 text-white transition-colors cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <Pin className="h-4 w-4" />
                <span className="font-medium">{isPinned ? "Unpin" : "Pin"}</span>
              </Button>
            )}

            {/* Delete (Own messages only) */}
            {canDelete && (
              <>
                <div className="h-px bg-white/10 my-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="w-full justify-start gap-3 h-9 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="font-medium">Delete</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
