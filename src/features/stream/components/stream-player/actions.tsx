"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { onFollow, onUnfollow } from "@/server/actions/follow";
import { UnfollowDialog } from "./unfollow-dialog";
import { ShareButton } from "./share-button";
import { SubscribeButton } from "./subscribe-button";

interface ActionsProps {
  hostIdentity: string;
  hostName: string;
  hostImageUrl: string;
  isFollowing: boolean;
  isHost: boolean;
  streamUrl: string;
};

export const Actions = ({
  hostIdentity,
  hostName,
  hostImageUrl,
  isFollowing,
  isHost,
  streamUrl,
}: ActionsProps) => {
  const [isPending, startTransition] = useTransition();
  const [isUnfollowDialogOpen, setIsUnfollowDialogOpen] = useState(false);
  const [optimisticFollowing, setOptimisticFollowing] = useState(isFollowing);
  const router = useRouter();
  const { userId } = useAuth();

  const handleFollow = () => {
    // Optimistic UI update - immediately show the change
    setOptimisticFollowing(true);
    
    startTransition(() => {
      onFollow(hostIdentity)
        .then((data) => {
          toast.success(`You are now following ${data.following.username}`);
          // Keep optimistic state since it was correct
        })
        .catch(() => {
          // Revert optimistic state on error
          setOptimisticFollowing(false);
          toast.error("Something went wrong");
        });
    });
  }

  const handleUnfollow = () => {
    // Optimistic UI update - immediately show the change
    setOptimisticFollowing(false);
    
    startTransition(() => {
      onUnfollow(hostIdentity)
        .then((data) => {
          toast.success(`You have unfollowed ${data.following.username}`);
          // Keep optimistic state since it was correct
        })
        .catch(() => {
          // Revert optimistic state on error
          setOptimisticFollowing(true);
          toast.error("Something went wrong");
        });
    });
  }

  const handleFollowClick = () => {
    if (!userId) {
      return router.push("/sign-in");
    }

    if (isHost) return;

    if (optimisticFollowing) {
      setIsUnfollowDialogOpen(true);
    } else {
      handleFollow();
    }
  }

  // Use optimistic state for UI
  const currentFollowingState = optimisticFollowing;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Follow/Unfollow Button */}
        <Button
          disabled={isPending || isHost}
          onClick={handleFollowClick}
          size="sm"
          className={cn(
            "w-full lg:w-auto gap-2 transition-all duration-200 font-semibold",
            "hover:scale-105 active:scale-95",
            currentFollowingState
              ? "bg-[#1F2127] hover:bg-[#272A33] text-white border border-gray-600 hover:border-gray-500 rounded-lg"
              : "bg-gradient-to-r from-[#0FA84E] to-[#0C8A3E] hover:from-[#0C8A3E] hover:to-[#0A7A35] text-white shadow-lg hover:shadow-xl hover:shadow-[#0FA84E]/25"
          )}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="animate-pulse font-medium">
                {isFollowing ? "Unfollowing..." : "Following..."}
              </span>
            </div>
          ) : (
            <>
              <Heart className={cn(
                "h-4 w-4 transition-all duration-200",
                "hover:scale-110",
                currentFollowingState
                  ? "fill-white stroke-none"
                  : "fill-white stroke-none"
              )} />
              {currentFollowingState ? "Unfollow" : "Follow"}
            </>
          )}
        </Button>

        {/* Share Button */}
        <ShareButton hostName={hostName} streamUrl={streamUrl} />

        {/* Subscribe Button */}
        <SubscribeButton />
      </div>

      {/* Unfollow Confirmation Dialog */}
      <UnfollowDialog
        isOpen={isUnfollowDialogOpen}
        onClose={() => setIsUnfollowDialogOpen(false)}
        onConfirm={handleUnfollow}
        hostIdentity={hostIdentity}
        hostName={hostName}
        hostImageUrl={hostImageUrl}
      />
    </>
  )
};

export const ActionsSkeleton = () => {
  return (
    <Skeleton className="h-10 w-full lg:w-24" />
  );
};
