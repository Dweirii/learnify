"use client";

import { UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/user-avatar";

interface UnfollowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hostIdentity: string;
  hostName: string;
  hostImageUrl: string;
}

export const UnfollowDialog = ({
  isOpen,
  onClose,
  onConfirm,
  hostName,
  hostImageUrl,
}: UnfollowDialogProps) => {
  const handleUnfollow = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#141517] border-none text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-400" />
            </div>
            <span>Unfollow {hostName}?</span>
          </DialogTitle>
          <DialogDescription className="pt-2 text-gray-300">
            You&apos;ll stop seeing {hostName}&apos;s streams in your feed and won&apos;t receive notifications when they go live.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 bg-[#1F2127]/30 rounded-lg">
          <UserAvatar
            imageUrl={hostImageUrl}
            username={hostName}
            size="lg"
            isLive={false}
            showBadge={false}
          />
          <div>
            <p className="font-medium text-white">{hostName}</p>
            <p className="text-sm text-gray-400">Streamer</p>
          </div>
        </div>

        <DialogFooter className="gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-600 bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleUnfollow}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Unfollow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
