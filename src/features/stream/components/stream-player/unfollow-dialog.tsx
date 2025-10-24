"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { onUnfollow } from "@/server/actions/follow";

interface UnfollowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hostIdentity: string;
  hostName: string;
  hostImageUrl: string;
}

export const UnfollowDialog = ({
  isOpen,
  onClose,
  hostIdentity,
  hostName,
  hostImageUrl,
}: UnfollowDialogProps) => {
  const [isPending, startTransition] = useTransition();

  const handleUnfollow = () => {
    startTransition(() => {
      onUnfollow(hostIdentity)
        .then((data) => {
          toast.success(`You have unfollowed ${data.following.username}`);
          onClose();
        })
        .catch(() => {
          toast.error("Something went wrong");
        });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <UserX className="w-6 h-6 text-destructive" />
            </div>
            <span>Unfollow {hostName}?</span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            You'll stop seeing {hostName}'s streams in your feed and won't receive notifications when they go live.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <UserAvatar
            imageUrl={hostImageUrl}
            username={hostName}
            size="md"
            isLive={false}
            showBadge={false}
          />
          <div>
            <p className="font-semibold">{hostName}</p>
            <p className="text-sm text-muted-foreground">Streamer</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleUnfollow}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Unfollowing..." : "Unfollow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
