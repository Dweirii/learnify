"use client";

import { X, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceivedChatMessage } from "@livekit/components-react";

interface ReplyPreviewProps {
  replyMessage: ReceivedChatMessage | null;
  onCancel: () => void;
}

export const ReplyPreview = ({ replyMessage, onCancel }: ReplyPreviewProps) => {
  if (!replyMessage) return null;

  const messagePreview = replyMessage.message.length > 80 
    ? `${replyMessage.message.slice(0, 80)}...` 
    : replyMessage.message;

  return (
    <div className="relative mb-3 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-2 px-3 py-2 bg-white/[0.03] rounded-md border border-white/[0.08] hover:bg-white/[0.05] transition-colors">
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Reply className="w-3 h-3 text-white/30 flex-shrink-0" />
            <span className="text-[11px] font-medium text-white/40">
              Replying to <span className="text-white/60">{replyMessage.from?.name}</span>
            </span>
          </div>
          <p className="text-xs text-white/50 break-words line-clamp-1 leading-relaxed">
            {messagePreview}
          </p>
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-5 w-5 p-0 hover:bg-white/10 rounded transition-all flex-shrink-0 -mt-0.5"
        >
          <X className="h-3 w-3 text-white/30 hover:text-white/50" />
        </Button>
      </div>
    </div>
  );
};
