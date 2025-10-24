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
import { onFollow } from "@/server/actions/follow";
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
  const router = useRouter();
  const { userId } = useAuth();

  const handleFollow = () => {
    startTransition(() => {
      onFollow(hostIdentity)
        .then((data) => toast.success(`You are now following ${data.following.username}`))
        .catch(() => toast.error("Something went wrong"))
    });
  }

  const handleFollowClick = () => {
    if (!userId) {
      return router.push("/sign-in");
    }

    if (isHost) return;

    if (isFollowing) {
      setIsUnfollowDialogOpen(true);
    } else {
      handleFollow();
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Follow/Unfollow Button */}
        <Button
          disabled={isPending || isHost}
          onClick={handleFollowClick}
          size="sm"
          className={cn(
            "w-full lg:w-auto gap-2 transition-all duration-200",
            isFollowing
              ? "bg-muted hover:bg-muted/80 text-foreground"
              : "bg-gradient-to-r from-[#0FA84E] to-[#0C8A3E] hover:from-[#0C8A3E] hover:to-[#0A7A35] text-white shadow-lg hover:shadow-xl"
          )}
        >
          <Heart className={cn(
            "h-4 w-4 transition-all duration-200",
            isFollowing
              ? "fill-muted-foreground"
              : "fill-white"
          )} />
          {isFollowing ? "Unfollow" : "Follow"}
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
